import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {Chart} from 'react-google-charts';
import { Button, TextField, Grid, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateField } from '@mui/x-date-pickers/DateField';

const PrimeraEtapa = () => {
  const [valorSubOT, setValorSubOT] = useState('');
  const [enTrabajo, setEnTrabajo] = useState(0);
  const [ComponentsList, setComponentsList] = useState([]);
  const [fechaEntrega, setFechaEntrega] = useState(dayjs());
  const [data, setData] = useState([]);
  const [contadorSubOT, setContadorSubOT] = useState(1);
  const [uniqueId, setUniqueId] = useState(1);
  const [error, setError] = useState(false);

  const { NumOT } = useParams();
  const numOT = NumOT;

  const fetchData = async (numOT) => {
    try {
      const response = await fetch(import.meta.env.VITE_API_CONEXION+'/otDetalle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numOT }),
      });

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.log(error);
    }
  };
  
  useEffect(() => {
    fetchData(numOT);
  }, [numOT]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (valorSubOT === '' || fechaEntrega === '') {
      setError("No se puede dejar campos vacios");
      return;
    }
    if (isNaN(parseInt(valorSubOT))) {
      setError("El valor ingresado no es un numero");
      return;
    }
    if (parseInt(valorSubOT) <= 0) {
      setError("El valor ingresado debe ser mayor a 0");
      return;
    }
    if (parseInt(valorSubOT) > parseInt(data[0].Cantidad)) {
      setError("El valor ingresado no puede ser mayor a la cantidad de la OT");
      return;
    }

    const removeSubOT = (id) => {
      setComponentsList((prevComponentsList) => {
        const componentToRemove = prevComponentsList.find((subOT) => subOT.props.id === id);
        if (componentToRemove) {
          setEnTrabajo((prevEnTrabajo) => prevEnTrabajo - componentToRemove.props.valorSubOT);
          setContadorSubOT((prevContadorSubOT) => prevContadorSubOT - 1);
          return prevComponentsList.filter((subOT) => subOT.props.id !== id);
        }
        return prevComponentsList;
      });
    };

    const fechaFinal = fechaEntrega.format('DD-MM-YYYY');
    setContadorSubOT(contadorSubOT + 1);
    setEnTrabajo(enTrabajo + parseInt(valorSubOT));
    setValorSubOT('');
    setFechaEntrega(dayjs());
    setError(false);
    setUniqueId(uniqueId + 1);
    setComponentsList((prevComponentsList) => [
      ...prevComponentsList,
      <SubOT
        key={uniqueId}
        id={uniqueId}
        valorSubOT={valorSubOT}
        fechaEntrega={fechaFinal}
        contadorSubOT={contadorSubOT}
        numOT={numOT}
        onRemove={removeSubOT}
      />,
    ]);
  };

  return (
    <>
     
      <div className="flex justify-center ">
      {data.length > 0 ? (
            <TableContainer>
            <Table>
            <TableHead>
            <TableRow>
            <TableCell className="font-roboto">OT</TableCell>
            <TableCell className="font-roboto">Cantidad</TableCell>
            <TableCell className="font-roboto">Producto</TableCell>
            <TableCell className="font-roboto">En trabajo</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {data.map((item, index) => (
            <TableRow key={index}>
            <TableCell>{item.NumOt}</TableCell>
            <TableCell>{item.Cantidad}</TableCell>
            <TableCell>{item.Producto}</TableCell>
            <TableCell>{enTrabajo}</TableCell>
            </TableRow>
            ))}
            </TableBody>
            </Table>
            </TableContainer>
            ) : (
            <div>Loading...</div>
            )}

  </div>
  <div className="flex p-2">
    <div className="mx-auto mt-10 p-2 ">
      <form onSubmit={handleSubmit}>
        <Grid container alignItems="center" justify="center" direction="column">
          <Grid item>
            <TextField
              sx={{ m: 1, width: '40ch' }}
              type="text"
              value={valorSubOT}
              label="Ingrese la cantidad de la subOT" 
              variant="outlined"
              onChange={(e) => setValorSubOT(e.target.value)}
            />
          </Grid>
          <Grid item>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateField
                label="Fecha de entrega"
                sx={{ m: 1, width: '40ch' }}
                value={fechaEntrega}
                onChange={(newFechaEntrega) => setFechaEntrega(newFechaEntrega)}
                renderInput={(params) => <TextField {...params} />}
                format="DD-MM-YYYY"
              />
            </LocalizationProvider>
          </Grid>
          {error && (
            <Grid item>
              <Alert sx={{ m: 1, width: '40ch' }}
              severity="error">{error}</Alert>
            </Grid>
          )}
          <Grid item>
            <Button variant="contained" type="submit">
              Agregar SubOT
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
    <div className='mx-auto'>
      <Chart
        width={'400px'}
        height={'300px'}
        chartType="PieChart"
        loader={<div>Loading Chart</div>}
        data={[
          ['Task', 'Hours per Day'],
          ['En trabajo', enTrabajo],
          ['Restante', data[0]?.Cantidad - enTrabajo],
        ]}
        options={{
          title: 'En trabajo vs Restante',
        }}
      />
    </div>
  </div>
  <div>{ComponentsList}</div>
</>
);
};

export default PrimeraEtapa;