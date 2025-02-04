import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import { ClientPage } from './pages/clients/ClientPage'
import { ClientFormPage } from './pages/clients/ClientFormPage'
import { HomePage } from './pages/HomePage'
import { OrderPage } from './pages/orders/OrderPage'
import { OrderFormPage } from './pages/orders/OrderFormPage'
import { ProgramPage } from './pages/programs/ProgramPage'
import { ProgramFormPage } from './pages/programs/ProgramFormPage'
import { ProgramaCard } from './components/Programa/ProgramaCard'
import { ProgramDetail } from './pages/programs/ProgramDetail'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <BrowserRouter>
      <Routes>
       <Route path='/' element={<Navigate to="/home"/>}/>
       <Route path='/home' element={<HomePage/>}/>
       <Route path='/clients' element={<ClientPage/>}/>
       <Route path='/clients-create' element={<ClientFormPage/>}/>
       <Route path='/clients/:id' element={<ClientFormPage/>}/>
       <Route path='/orders' element={<OrderPage/>}/>
       <Route path='/orders-create' element={<OrderFormPage/>}/>
       <Route path='/orders/:id' element={<OrderFormPage/>}/>
       <Route path='/programs' element={<ProgramPage/>}/>
       <Route path='/programs-create' element={<ProgramFormPage/>}/>
       <Route path='/programs/:programId' element={<ProgramDetail/>}/>
      </Routes>
      <Toaster/>
    </BrowserRouter>
  )
}

export default App