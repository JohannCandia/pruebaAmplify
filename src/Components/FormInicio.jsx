import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tab, Tabs, Typography, Fade, Button, TextField, Table, TableBody, TableCell, Box, TableHead, TableRow, TableFooter, List, ListItem, Grid, Modal } from "@mui/material";
import TabPanel from './TabPanel';

import './styles.css'; // importar el archivo CSS para las animaciones


function Consulta() {
  const [numOT, setNumOT] = useState('');
  const [historicoData, setHistoricoData] = useState([]);
  const [otDetalleData, setOtDetalleData] = useState([]);
  const [dataPorArea, setDataPorArea] = useState([]);
  const [error, setError] = useState(null);
  const [totalCantidad, setTotalCantidad] = useState(null);
  const [encontrada, setEncontrada] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [Merma, setMerma] = useState(0);
  const [open, setOpen] = useState(false);


  var totalMerma = 0;
  const styless = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
  };
  const areas = {
    AI1: "Impresión", PC1: "Pinchado", AL1: "Laminado", AQ1: "Troquelado", AC1: "Control de calidad", H01: "Holograma 1",
    H02: "Holograma 2", HST: "Hot stamping", AV1: "Muhlbauer Chips",
  };
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const obtenerNombreArea = (codigoArea) => areas[codigoArea] || codigoArea;
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const fetchData = async () => {

    if (numOT === '') {
      window.alert('Debe ingresar el número de OT');
      return;
    }
    if (isNaN(numOT)) {
      window.alert('El número de OT debe ser un número');
      return;
    }

    setError(null);
    try {
      const historicoResult = await fetch(import.meta.env.VITE_API_CONEXION+'/historico2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numOT }),
      });

      const otDetalleResult = await fetch(import.meta.env.VITE_API_CONEXION+'/otDetalle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numOT }),
      });

      if (!historicoResult.ok) {
        setEncontrada(false);
        throw new Error("OT NO ENCONTRADA");
      } else {
        setEncontrada(true);

      }

      const historicoData = await historicoResult.json();
      const otDetalleData = await otDetalleResult.json();
      setHistoricoData(historicoData);
      setOtDetalleData(otDetalleData);

      // Objeto que guarda la cantidad total por área
      const totalPorArea = {};

      // Sumar las cantidades por área
      historicoData.forEach((row) => {
        totalMerma = totalMerma + parseInt(row.Contador2);

        const { Codigo_Area, Cantidad } = row;
        if (totalPorArea[Codigo_Area]) {
          totalPorArea[Codigo_Area] += Cantidad;

        } else {
          totalPorArea[Codigo_Area] = Cantidad;
        }
      });

      // Generar la lista de objetos con la cantidad total por área
      const dataPorArea = Object.entries(totalPorArea).map(([area, cantidad]) => ({
        area,
        cantidad,

      }));
      setMerma(totalMerma);

      // Calcular la suma total de todas las cantidades
      const totalCantidad = historicoData.reduce((accumulator, currentValue) => accumulator + currentValue.Cantidad, 0);
      setDataPorArea(dataPorArea);
      setTotalCantidad(totalCantidad);
    } catch (err) {
      setError(err.message);
    }
  }

  const formatDate = (isoDateString) => {
    const date = new Date(isoDateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return ` ${day}-${month}-${year}`;
  };

  return (
    <>
      <div className="flex justify-between">
      </div>
      <div>
        <Button
          color='primary'
          variant='contained'
          sx={{ mt: 2, mb: 2, mx: 2 }}                           >
          <Link to={`/`}>Volver a listado</Link>
        </Button>
      </div>
      <div className="flex flex-col items-center">
        <Typography sx={{ mt: 2, mb: 4 }} variant="h5"
        >Consulta detalles OT </Typography>
        <div className="mb-10 flex flex-col w-1/3">
          <TextField
            type="text"
            value={numOT}
            onChange={(e) => setNumOT(e.target.value)}
            label="Número de OT"
          />
          <Button
            color='success'
            variant='contained'
            sx={{ mt: 2, mb: 2 }}
            onClick={fetchData}
          >
            Buscar
          </Button>
        </div>

        {encontrada ? (
          <>
            <Grid
              sx={{ mt: 2, mb: 4 }}
              container
              spacing={0}
              alignItems="center"
              justifyContent="center"
            >
              {otDetalleData && otDetalleData.length > 0 && (
                <Grid>
                  <Button onClick={handleOpen} color='warning'
                    variant='contained'
                    sx={{ mt: 2, mb: 2, mx: 2 }} >  Abrir Detalles de la ot
                  </Button>
                  <Modal disableEnforceFocus disableAutoFocus
                    aria-labelledby="transition-modal-title"
                    aria-describedby="transition-modal-description"
                    open={open}
                    onClose={handleClose}
                    closeAfterTransition
                    keepMounted
                  >
                    <Fade in={open} onClose={handleClose}>
                      <Box sx={styless}>
                        {otDetalleData.map((row, index) => (
                          <Typography sx={{ mt: 1 }} key={index}> Producto: {row.Producto} </Typography>
                        ))}
                        {otDetalleData.map((row, index) => (
                          <Typography sx={{ mt: 1 }} key={index}> Numero de OT: {row.NumOt} </Typography>
                        ))}
                        {otDetalleData.map((row, index) => (
                          <Typography sx={{ mt: 1 }} key={index}> Cantidad General: {row.Cantidad} </Typography>
                        ))}
                        <Typography sx={{ mt: 1 }}>Merma general: {Merma}</Typography>
                        <div className='flex flex-row justify-between mt-4'>

                          <Button onClick={handleClose} variant="contained" color="error" >

                            Cerrar
                          </Button>
                        </div>
                      </Box>
                    </Fade>
                  </Modal>
                </Grid>
              )}
            </Grid>

            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
            >
              {dataPorArea.map((row, index) => (
                <Tab
                  key={index}
                  label={obtenerNombreArea(row.area)}
                  {...a11yProps(index)}
                />
              ))}
            </Tabs>

            {dataPorArea.map((row, index) => (
              <TabPanel key={index} value={tabIndex} index={index}>
                <Fade in={tabIndex === index} timeout={700}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ '&:last-child TableCell, &:last-child th': { border: 0 } }}>
                        <TableCell align='center' >   Numero de OT </TableCell>
                        <TableCell align='center' >   Operador </TableCell>
                        <TableCell align='center' >   Cantidad  </TableCell>
                        <TableCell align='center' >   Fecha </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historicoData
                        .filter((item) => item.Codigo_Area === row.area)
                        .map((filteredRow, index) => (
                          <TableRow
                            className='hover:bg-gray-200'
                            key={index}
                            sx={{ '&:last-child TableCell, &:last-child th': { border: 0 } }}
                          >
                            <TableCell align='center'> {filteredRow.Num_Ot}</TableCell>
                            <TableCell align='center'> {filteredRow.Rut_Operador}</TableCell>
                            <TableCell align='center'> {filteredRow.Cantidad}</TableCell>
                            <TableCell align='center' sx={{ width: 210 }}> {formatDate(filteredRow.Fecha)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter align='right' >
                    </TableFooter>
                  </Table>
                </Fade>
              </TabPanel>
            ))}
          </>
        ) : (
          <h2>No se ha encontrado la OT</h2>
        )}
      </div>
    </>
  );
}
export default Consulta;