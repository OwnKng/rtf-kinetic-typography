import { useFrame, useThree } from "@react-three/fiber"
import { useRef } from "react"
import { useMemo } from "react"
import * as THREE from "three"
import { ShaderMaterial } from "three"
import Text from "./Text"

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

const fragmentShader = /*glsl*/ `
    uniform sampler2D envMap; 
    uniform vec2 resolution; 

    varying vec3 worldNormal;
    varying vec3 viewDirection;

    float calculateFresnel(vec3 viewDirection, vec3 worldNormal) {
        return pow(1.01 + dot( viewDirection, worldNormal), 5.0);
    }

    void main() {
        vec2 _uv = gl_FragCoord.xy / resolution;
        float alpha = 0.4; 
        vec3 normal = worldNormal * (1.0 - alpha);

        vec2 repeat = vec2(4.0, 4.0);
        _uv = fract(_uv * repeat + vec2(0.5, -0.5)); 
        _uv += refract(viewDirection, normal, 1.0 / 1.33).xy; 

        float f = calculateFresnel(viewDirection, normal); 

        vec3 refractedColor = vec3(1.0); 

        vec3 color = texture2D(envMap, _uv).rgb; 

        gl_FragColor = vec4(mix(color, refractedColor, f), 1.0);
    }
`

const Sketch = () => {
  const { size, gl, scene, camera } = useThree()

  const ref = useRef<THREE.Mesh>(null!)

  const ratio = gl.getPixelRatio()

  const [envFbo, refractionMaterial] = useMemo(() => {
    const envFbo = new THREE.WebGLRenderTarget(
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
      },
    })

    return [envFbo, refractionMaterial]
  }, [size.width, size.height, ratio])

  useFrame(({ mouse }) => {
    gl.autoClear = false

    gl.setRenderTarget(envFbo)
    gl.clearColor()
    gl.render(scene, camera)
    gl.clearDepth()

    gl.setRenderTarget(null)
    gl.render(scene, camera)
    gl.clearDepth()

    ref.current.rotation.z = mouse.x * Math.PI * 0.5
    ref.current.rotation.x = mouse.y * Math.PI * 0.5
  })

  return (
    <>
      <Text />
      <mesh position={[0, 0, 0]} ref={ref} material={refractionMaterial}>
        <icosahedronBufferGeometry args={[5, 0]} />
      </mesh>
    </>
  )
}

export default Sketch
