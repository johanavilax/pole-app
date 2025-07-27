import { Provider } from 'react-redux'
import './App.css'
import MainLayout from './components/MainLayout'
import { CanvasProvider } from './contexts/CanvasContext'
import { store } from './store/store'

function App() {
  return (
    <Provider store={store}>
      <CanvasProvider>
        <div className="app">
          <MainLayout />
        </div>
      </CanvasProvider>
    </Provider>
  )
}

export default App
