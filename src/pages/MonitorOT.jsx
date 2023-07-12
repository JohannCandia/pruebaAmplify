import { Button, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material'
import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import ToExcel from '../Components/ToExcel';
import TabPanel from '../Components/TabPanel';
import axios from 'axios';
const areas = {
  AI1: "Impresión", PC1: "Pinchado", AL1: "Laminado", AQ1: "Troquelado", AC1: "Control de calidad", H01: "Holograma 1",
  H02: "Holograma 2", HST: "Hot stamping", AV1: "Muhlbauer Chips", AC3: "Calidad-2"
};
const areasList = Object.keys(areas);

const MonitorOT = () => {
  const [totales, setTotales] = useState([]);
  const [otDetalles, setOtDetalles] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const filenameByArea = {};
  const sheetByArea = {};
  const tableRef = useRef(null);

  const fetchHistorico = async () => {
    const res = await fetch('http://internal-a032771aed78c4f10b69ab42863f3f1c-972419124.us-east-1.elb.amazonaws.com/historico2');
    const data = await res.json();
    setTotales(data);

  }

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  const fetchOtDetalles = async () => {
    const res = await fetch("http://internal-a032771aed78c4f10b69ab42863f3f1c-972419124.us-east-1.elb.amazonaws.com/MonitorOtActiva");
    const data = await res.json();
    const groupedOtDetalles = {};
    data.forEach((detalle) => {
      if (detalle.NumOt in groupedOtDetalles) {
        groupedOtDetalles[detalle.NumOt].Cantidad += detalle.Cantidad;
        groupedOtDetalles[detalle.NumOt].Producto += `, ${detalle.Producto}`;
      } else {
        groupedOtDetalles[detalle.NumOt] = {
          Cantidad: detalle.Cantidad,
          Producto: detalle.Producto,
          Cliente: detalle.NombreCliente
        };
      }
    });

    setOtDetalles(groupedOtDetalles);
    console.log(groupedOtDetalles);
  };

  useEffect(() => {
    fetchHistorico()
    fetchOtDetalles()
  }, [])
  const groupedTotales = totales.reduce((acc, registro) => {
    const { Num_OT, Codigo_Area, Total_Cantidad } = registro;
    if (!acc[Num_OT]) {
      acc[Num_OT] = {};
    }
    acc[Num_OT][Codigo_Area] = Total_Cantidad;
    return acc;
  }, {});

  const areasList = Object.keys(areas);
  const prepareDataForExcel = (groupedTotales, otDetalles, selectedArea) => {
    const data = [];

    Object.keys(groupedTotales).forEach((numOT) => {
      const currentIndex = areasList.indexOf(selectedArea);
      const getLastValidArea = (currentIndex) => {
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (groupedTotales[numOT][areasList[i]]) {
            return areasList[i];
          }
        }
        return null;
      };

      const getNextValidArea = (currentIndex) => {
        for (let i = currentIndex + 1; i < areasList.length; i++) {
          if (groupedTotales[numOT][areasList[i]]) {
            return areasList[i];
          }
        }
        return null;
      };

      const previousArea = getLastValidArea(currentIndex);
      const previousAreaQuantity = previousArea ? groupedTotales[numOT][previousArea] : 0;
      const nextArea = getNextValidArea(currentIndex);
      const nextAreaQuantity = nextArea ? groupedTotales[numOT][nextArea] : 0;

      const remainingQuantity = (() => {
        if (currentIndex === 0) {
          return Math.round((otDetalles[numOT]?.Cantidad / 12) - previousAreaQuantity);
        } else if (currentIndex === 2) {
          return Math.round(previousAreaQuantity - (nextAreaQuantity / 12));
        } else if (currentIndex === 3) {
          return Math.round((previousAreaQuantity * 12) - nextAreaQuantity);
        } else {
          return Math.round(previousAreaQuantity - nextAreaQuantity);
        }
      })();

      const item = {
        numOT,
        Cliente: otDetalles[numOT]?.Cliente || '',
        Producto: otDetalles[numOT]?.Producto || '',
        Cantidad: otDetalles[numOT]?.Cantidad || 0,
        Procesado: groupedTotales[numOT][selectedArea] || 0,
        Cantidad_a_procesar: remainingQuantity > 0 ? remainingQuantity : 0,
        Merma: otDetalles[numOT]?.Merma || 0,
      };

      data.push(item);
    });

    return data;
  };


  areasList.forEach((area) => {
    sheetByArea[area] = areas[area];
  });
  const tablesData = {};
  areasList.forEach((area) => {
    tablesData[area] = prepareDataForExcel(groupedTotales, otDetalles, area);
  });

  const currentIndex = areasList.indexOf(areas);
  const previousArea = currentIndex > 0 ? areasList[currentIndex - 1] : null;

  const handleTerminada = async (numOT, codigoArea) => {
    // Mostrar una ventana de confirmación
    const isConfirmed = window.confirm("¿Estás seguro de que deseas cerrar esta OT para esta area?");
  
    // Si el usuario confirma, continuar con el proceso de cerrar la OT
    if (isConfirmed) {
      try {
        // Primero, marca la OT como terminada
        const response = await fetch('http://internal-a032771aed78c4f10b69ab42863f3f1c-972419124.us-east-1.elb.amazonaws.com/updateTerminada', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Num_OT: numOT,
            Codigo_Area: codigoArea,
          }),
        });
  
        const data = await response.json();
  
        if (data.message) {
          // Si se actualiza correctamente, recarga los datos del historico y detalles de la OT
          fetchHistorico();
          fetchOtDetalles();
  
          removeFromTable(numOT, codigoArea);
  
        } else {
          console.error('Error al marcar OT como terminada:', data.error);
        }
      } catch (error) {
        console.error('Error al marcar OT como terminada:', error);
      }
    }
  };
  
  


  return (
    <>
      <div className="flex flex-row justify-between  mx-10 mt-10">
        <Typography variant='h4' align='center'>Monitor de OTs activas</Typography>
        <Link to="/OTS"> <Button variant="contained" color="primary">Necesitas consultar por una OT especifica?</Button></Link>
        <ToExcel data={tablesData} filenameByArea={filenameByArea} sheetByArea={sheetByArea} />
      </div>
      <div className="flex flex-col items-center justify-center mt-10 p-10">
        <Tabs value={activeTab} onChange={handleChange}>
          {areasList.map((area, index) => (
            <Tab key={index} label={areas[area]} />
          ))}
        </Tabs>
        {areasList.map((area, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            <Table ref={tableRef}>
              <TableHead>
                <TableRow>
                  <TableCell>Número de OT</TableCell>
                  <TableCell>Nombre de cliente</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Cantidad OT</TableCell>
                  <TableCell>Procesado</TableCell>
                  <TableCell>Cantidad a procesar</TableCell>
                  <TableCell>Merma</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(groupedTotales)
                  .sort((a, b) => b - a)
                  .map((numOT) => {
                    const currentIndex = areasList.indexOf(area);

                    const getLastValidArea = (currentIndex) => {
                      for (let i = currentIndex - 1; i >= 0; i--) {
                        if (groupedTotales[numOT][areasList[i]]) {
                          return areasList[i];
                        }
                      }
                      return null;
                    };

                    const getNextValidArea = (currentIndex) => {
                      for (let i = currentIndex + 1; i < areasList.length; i++) {
                        if (groupedTotales[numOT][areasList[i]]) {
                          return areasList[i];
                        }
                      }
                      return null;
                    };

                    const previousArea = getLastValidArea(currentIndex);
                    const previousAreaQuantity = previousArea ? groupedTotales[numOT][previousArea] : 0;
                    const nextArea = getNextValidArea(currentIndex);
                    const nextAreaQuantity = nextArea ? groupedTotales[numOT][nextArea] : 0;

                    const remainingQuantity = (() => {
                      if (currentIndex === 0) {
                        return Math.round((otDetalles[numOT]?.Cantidad / 12) - previousAreaQuantity);
                      } else if (currentIndex === 2) {
                        return Math.round(previousAreaQuantity - (nextAreaQuantity / 12));
                      } else if (currentIndex === 3) {
                        return Math.round((previousAreaQuantity * 12) - nextAreaQuantity);
                      } else {
                        return Math.round(previousAreaQuantity - nextAreaQuantity);
                      }
                    })();

                    if (groupedTotales[numOT][area] && groupedTotales[numOT][area] > 0) {

                    return (
                      <TableRow key={numOT}>
                        <TableCell>{numOT}</TableCell>
                        <TableCell>{otDetalles[numOT]?.Cliente || 0}</TableCell>
                        <TableCell>{otDetalles[numOT]?.Producto || 0}</TableCell>
                        <TableCell>
                          {otDetalles[numOT]?.Cantidad
                            ? otDetalles[numOT].Cantidad.toLocaleString()
                            : 0}
                        </TableCell>
                        <TableCell>
                          {groupedTotales[numOT][area]?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell>
                          {remainingQuantity > 0 ? remainingQuantity.toLocaleString() : 0}
                        </TableCell>
                        <TableCell>{otDetalles[numOT]?.Merma || 0}</TableCell>
                        <TableCell> <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleTerminada(numOT, area)}
                        >Cerrar OT</Button></TableCell>
                      </TableRow>
                    );
                  }
                  })}
                
              </TableBody>
            </Table>


          </TabPanel>
        ))}
      </div>

    </>
  )
}
export default MonitorOT