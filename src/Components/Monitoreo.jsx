import React, { useContext, useState, useCallback, useRef } from 'react'

const Monitoreo = ({valorSubOT ,ot, etapas, fechaEntrega, id}) => {
  
    const [Prod, setProd] = useState(0)
    const [rut , setRut] = useState('')
    const [terminadas , setTerminadas] = useState(0)
    const [etapasCantidad, setEtapasCantidad] = useState(new Array(etapas.length).fill(0));
    const inputRefs = useRef(etapas.map(() => React.createRef()));

   
  return (

        <>
        <div className='flex p-2 mt-2 w-full'>

            <div className='flex flex-col items-start p-10 w-full md:w-1/3 border border-slate-400'>
                        
                        <h1 className='text-xl font-bold font-roboto'>OT: {ot} - {id}</h1>
                        <h1 className='text-xl font-bold font-roboto'>Cantidad inicial de la Sub-OT: {valorSubOT}</h1>
                        <h1 className='font-roboto mt-2 font-bold text-xl'>Fecha de entrega SUB-OT </h1>
                        <h1 className='text-xl font-bold font-roboto'>{fechaEntrega}</h1>
                
            </div>

            <div className='w-full md:w-2/3 p-10 border border-slate-400'>
                <h1 className='text-xl font-bold font-roboto uppercase'>En Proceso : {Prod}</h1>
                 {etapas.map((etapa, index) => (
                    <li className="mt-3 font-roboto list-none" key={index}>
                         <div className='flex justify-between'>
                                <h1> EN {etapa}: {etapasCantidad[index]} </h1>
                                <h1>Operador: 18699798-0</h1>
                                <span>Merma: 100</span>
                         </div>
                    </li>   
                ))}
              
                 <div className='flex justify-end mt-8'>
                     <h1 className='text-xl font-bold mt-2 text-center font-roboto uppercase'>Terminadas: {terminadas}</h1>
                 </div>
                    
  
            </div>
        </div>
       
        </>



   

  )
}

export default Monitoreo