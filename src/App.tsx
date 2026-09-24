import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { IntroHero } from './sections/IntroHero'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<IntroHero />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
