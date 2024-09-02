import React, { ChangeEvent, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Canvas, useGraph, useFrame } from '@react-three/fiber';
import { Color, Euler, Matrix4, SkinnedMesh } from 'three';
import { useGLTF, OrbitControls, Environment, ContactShadows} from '@react-three/drei';
import { DepthOfField, EffectComposer } from '@react-three/postprocessing';
import { Category,FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
let video: HTMLVideoElement
let faceLandmarker: FaceLandmarker
let lastVideoTime = -1
let headMesh: SkinnedMesh

let rotation: Euler
let blendshapes: Category[] = []

function App() {
  const [url, setUrl] = useState<string>("/Angus_1.glb")

  const handleOnChange = (e: any) => {
    setUrl(e.target.value)
  }

  const setup = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm")
    faceLandmarker = await FaceLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO"
      }
    )

    video = document.getElementById('video') as HTMLVideoElement
    navigator.mediaDevices.getUserMedia({
      video: {
        width: 1280,
        height: 720
      }
    }).then((stream) => {
      video.srcObject = stream
      video.addEventListener('loadeddata', predict)
    })

  }

  const predict = () => {
    const nowInMs = Date.now()
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime
      const result = faceLandmarker.detectForVideo(video, nowInMs)

      if(
          result.facialTransformationMatrixes 
          && result.facialTransformationMatrixes.length > 0
          && result.faceBlendshapes
          && result.faceBlendshapes.length > 0
        ){
        const matrix = new Matrix4().fromArray(result.facialTransformationMatrixes[0].data)
        rotation = new Euler().setFromRotationMatrix(matrix)

        blendshapes = result.faceBlendshapes[0].categories
      }
    }

    requestAnimationFrame(predict)
  }
 

  useEffect(() => {
    //setup()
  },[])

  return (
    <div className="App">
      {/* <input type="text" placeholder='enter oyur rpm avatar url' onChange={handleOnChange}/>
      <video autoPlay id='video'></video> */}
      <Canvas 
        style={{
          backgroundColor: 'white',
          width: '100%',
          height: '100vh'
        }}
       
        shadows 
        camera={{ fov: 25, position: [0,0,800],near: 0.1, far: 5000}}
      >
        <OrbitControls />
        {/* <ambientLight intensity={1}/>
        <pointLight position={[1,1,1]} color={new Color(1,0,0)} intensity={0.5}/>
        <pointLight position={[-1,1,1]} color={new Color(0,1,0)} intensity={0.5}/> */}
        <ambientLight intensity={1.3} />  {/* Lower intensity for ambient light */}
        
        {/* Directional Light */}
        <directionalLight
          position={[5, 10, 7.5]}
          intensity={1.5}  // Adjusted intensity
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={500}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Contact Shadows */}
        <ContactShadows
          position={[0, -1, 0]}
          opacity={0.5}  // Reduced opacity for subtler shadow
          scale={10}
          blur={1.5}
          far={4.5}
        />
        <Avatar url={url}/>
      </Canvas>
    </div>
  );
}

let testValue = 0
let prevCondition = true
function Avatar({url}: {url: string}){
  //const avatar = useGLTF(`${url}?morphTargets=ARKit&textureAtlas=1024`)
  const avatar = useGLTF(url)
  const { nodes } = useGraph(avatar.scene)

  useEffect(() => {
    headMesh = nodes.output as SkinnedMesh
    console.log(nodes)
  },[nodes])

  useFrame((_, delta) => {
    // if(headMesh !== null){
    //   blendshapes.forEach((blendshape) => {
    //     let index = headMesh.morphTargetDictionary![blendshape.categoryName]
    //     if(index >= 0){
    //       headMesh.morphTargetInfluences![index] = blendshape.score
    //     }
    //   })
    // }
  
    // nodes.Head.rotation.set(rotation.x /3, rotation.y/3, rotation.z/3)
    // nodes.Neck.rotation.set(rotation.x /3, rotation.y/3, rotation.z/3)
    // nodes.Spine1.rotation.set(rotation.x /3, rotation.y/3, rotation.z/3)
    if(headMesh){
      headMesh.morphTargetInfluences![0] = testValue
      headMesh.morphTargetInfluences![1] = testValue
      //headMesh.morphTargetInfluences![2] = testValue
      if(testValue >= 1){
        prevCondition = false
      }
      else if(testValue < 0){
        prevCondition = true
      }
      if(prevCondition){
        testValue += 0.01
      }
      else{
        testValue -= 0.01
      }
        
    }
  })
   
  return <primitive object={avatar.scene} position={[0,0,0]} />
}

export default App;
