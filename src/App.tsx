import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import Sketch from "./Sketch"

const App = () => (
  <div>
    <Canvas orthographic camera={{ zoom: 100, position: [0, 0, 500] }}>
      <OrbitControls />
      <Sketch />
    </Canvas>
  </div>
)

export default App
