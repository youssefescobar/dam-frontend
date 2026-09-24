import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { IntroHero } from './sections/IntroHero'

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<IntroHero />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
