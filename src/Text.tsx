import { useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

const vertexShader = `
    varying vec2 vUv; 
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
    }
`

const fragmentShader = `
    uniform sampler2D uTexture; 
    varying vec2 vUv; 

    void main() {
        float color = texture2D(uTexture, vUv).r; 

        color = smoothstep(0.3, 1.0, color); 
        color *= 0.75; 
        
        gl_FragColor = vec4(vec3(color), 1.0); 
    }
`

const Text = () => {
  const { viewport } = useThree()
  const ref = useRef<THREE.Mesh>(null!)

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas")

    const width = 1024
    const text = "FUTURE"

    canvas.width = width
    canvas.height = width / 2

    const fontSize = canvas.height * 0.95

    const ctx = canvas.getContext("2d")

    // @ts-ignore
    ctx.fillStyle = "black" // border color
    // @ts-ignore
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // @ts-ignore
    ctx.font = `Bold ${fontSize}px Arial`

    // @ts-ignore
    ctx.fillStyle = "white"

    // @ts-ignore
    ctx.fillText(text, 0, fontSize, width)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    return texture
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTexture: { value: texture },
    }),
    [texture]
  )

  return (
    <mesh position={[0, 0, -10]} ref={ref}>
      <planeBufferGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}

export default Text
