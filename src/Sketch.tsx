import { useTexture } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useRef } from "react"
import { useMemo } from "react"
import * as THREE from "three"
import { ShaderMaterial } from "three"

const vertexShader = /* glsl */ `
        varying vec3 worldNormal; 
        varying vec3 viewDirection; 

    void main() {
        vec4 transformedNormal = vec4(normal, 0.0); 
        vec4 modelPosition = vec4(position, 1.0);

        worldNormal = normalize(modelMatrix * transformedNormal).xyz; 
        viewDirection = normalize((modelMatrix * modelPosition).xyz - cameraPosition); 

        gl_Position = projectionMatrix * modelViewMatrix * modelPosition; 
    }
`

const backFace = /* glsl */ `
    varying vec3 worldNormal; 

    void main() {
        gl_FragColor = vec4(worldNormal, 1.0); 
    }
`

const fragmentShader = /*glsl*/ `
    uniform sampler2D envMap; 
    uniform sampler2D backfaceMap; 
    uniform vec2 resolution; 

    varying vec3 worldNormal;
    varying vec3 viewDirection;

    float calculateFresnel(vec3 viewDirection, vec3 worldNormal) {
        return pow(1.0 + dot( viewDirection, worldNormal), 4.0);
    }

    void main() {
        vec2 _uv = gl_FragCoord.xy / resolution;
        float alpha = 0.4; 
        vec3 normal = worldNormal * (1.0 - alpha) - texture2D(backfaceMap, _uv).rgb * alpha / 4.0;

        _uv += refract(viewDirection, normal, 1.0 / 1.33).xy; 

        float f = calculateFresnel(viewDirection, normal); 

        vec3 refractedColor = vec3(1.0); 

        float r = texture2D(envMap, _uv + vec2(0.02) * f).r;
        float g = texture2D(envMap, _uv - vec2(0.02) * f).g;
        float b = texture2D(envMap, _uv - vec2(0.02) * f).b;

        vec3 color = vec3(r, g, b); 

        gl_FragColor = vec4(mix(color, refractedColor, f), 1.0);
    }
`

const backfaceMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader: backFace,
  side: THREE.BackSide,
})

const Sketch = () => {
  const { size, gl, scene, camera, viewport } = useThree()
  const { width, height } = viewport

  const ref = useRef<THREE.Mesh>(null!)

  const texture = useTexture("hands-original.jpg")

  const ratio = gl.getPixelRatio()

  const [envFbo, backFbo, refractionMaterial] = useMemo(() => {
    const envFbo = new THREE.WebGLRenderTarget(
      size.width * ratio,
      size.height * ratio
    )
    const backFbo = new THREE.WebGLRenderTarget(
      size.width * ratio,
      size.height * ratio
    )

    const refractionMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        resolution: {
          value: new THREE.Vector2(size.width * ratio, size.height * ratio),
        },
        envMap: { value: envFbo.texture },
        backFaceMap: { value: backFbo.texture },
      },
    })

    return [envFbo, backFbo, refractionMaterial]
  }, [size.width, size.height, ratio])

  useFrame(({ mouse }) => {
    gl.autoClear = false
    camera.layers.set(0)
    gl.setRenderTarget(envFbo)
    gl.clearColor()
    gl.render(scene, camera)
    gl.clearDepth()
    camera.layers.set(1)
    ref.current.material = backfaceMaterial
    gl.setRenderTarget(backFbo)
    gl.clearDepth()
    gl.render(scene, camera)
    camera.layers.set(0)
    gl.setRenderTarget(null)
    gl.render(scene, camera)
    gl.clearDepth()
    camera.layers.set(1)
    ref.current.material = refractionMaterial
    gl.render(scene, camera)

    ref.current.position.lerp(
      new THREE.Vector3(mouse.x * width, mouse.y * height, -5),
      0.05
    )
  })

  return (
    <>
      <mesh position={[0, 0, -10]}>
        <planeBufferGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      <mesh position={[0, 0, -5]} ref={ref} layers={1}>
        <sphereBufferGeometry args={[2, 32, 32]} />
      </mesh>
    </>
  )
}

export default Sketch
