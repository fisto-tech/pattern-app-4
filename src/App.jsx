import { BrowserRouter, Routes, Route } from 'react-router-dom'
import EditorPage from './components/EditorPage'
import HomePage from './components/HomePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
