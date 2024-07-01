
import confetti from "canvas-confetti"
import React, { useEffect } from "react"

const Component = () => {

  useEffect(() => {
    confetti({ particleCount: 200, spread: 150, origin: { y: 0.6 }, })
  }, [])

  return <>


    Done!
  </>
}

export default Component