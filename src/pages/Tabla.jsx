import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

const MonitorOT = () => {
  const [data, setData] = useState([]);

  const fetchOtDetalles = async () => {
    const res = await fetch("http://internal-a032771aed78c4f10b69ab42863f3f1c-972419124.us-east-1.elb.amazonaws.com/historico");
    const data = await res.json();
    console.log(data);
    setData(data);
  };
  useEffect(() => {
    fetchOtDetalles();
  }, []);
  const groupedData = useMemo(() => {
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.DESCRIPCION_AREA]) {
        acc[item.DESCRIPCION_AREA] = {
          data: [],
          ordenVisualizacion: item.ORDEN_VISUALIZACION,
        };
      }
      if (item.estadoOT === 0) {
        acc[item.DESCRIPCION_AREA].data.push(item);
      }
      return acc;
    }, {});

    const orderedGroupedData = Object.entries(grouped)
      .sort((a, b) => a[1].ordenVisualizacion - b[1].ordenVisualizacion)
      .reduce((acc, [key, value]) => {
        acc[key] = value.data;
        return acc;
      }, {});

    return orderedGroupedData;
  }, [data]);

  const findPreviousStageProduccion = (
    NumOT,
    currentAreaOrdenVisualizacion,
    Cantidad
  ) => {
    if (currentAreaOrdenVisualizacion === 1) {
      return (Cantidad / 12).toFixed(0);
    }

    const previousArea = Object.values(groupedData).find(
      (area) =>
        area[0]?.ORDEN_VISUALIZACION === currentAreaOrdenVisualizacion - 1
    );
    if (previousArea) {
      const previousStage = previousArea.find((item) => item.NumOT === NumOT);
      if (previousStage) {
        return previousStage.produccion * 12 || 0;
      }
    }
    return 0;
  };

  const otNumbers = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.NumOT))).sort();
  }, [data]);
  const shouldDisplayRow = (otNumber) => {
    return Object.entries(groupedData).some(([area, areaData]) => {
      const row = areaData.find((item) => item.NumOT === otNumber);
      if (!row) {
        return false;
      }
      const value =
        Math.max(
          0,
          findPreviousStageProduccion(
            row.NumOT,
            row.ORDEN_VISUALIZACION,
            row.Cantidad * 12
          ) -
            findPreviousStageProduccion(
              row.NumOT,
              row.ORDEN_VISUALIZACION + 1,
              row.Cantidad * 12
            )
        ) !== 0;
      return value;
    });
  };
  const filteredOtNumbers = useMemo(() => {
    return otNumbers.filter(shouldDisplayRow);
  }, [otNumbers, groupedData]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredOtNumbers.map((otNumber) => {
        const rowData = {
          "Número de OT": otNumber,
          "Cantidad de la OT": data.find((item) => item.NumOT === otNumber)?.Cantidad,
          "Cliente": data.find((item) => item.NumOT === otNumber)?.NombreCliente,
          "Producto": data.find((item) => item.NumOT === otNumber)?.Producto,
          ...Object.entries(groupedData).reduce((acc, [area, areaData]) => {
            const row = areaData.find((item) => item.NumOT === otNumber);
            acc[area] = row
              ? Math.max(
                  0,
                  findPreviousStageProduccion(
                    row.NumOT,
                    row.ORDEN_VISUALIZACION,
                    row.Cantidad * 12
                  ) -
                    findPreviousStageProduccion(
                      row.NumOT,
                      row.ORDEN_VISUALIZACION + 1,
                      row.Cantidad * 12
                    )
                )
              : "";
            return acc;
          }, {}),
        };
        return rowData;
      })
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MonitorOT");
    XLSX.writeFile(wb, "MonitorOT.xlsx");
  };

  return (
    <>
      <div className="mb-5 mt-5 mx-4">
        <div className="flex justify-between">

        <Link to="/">
          <Button variant="outlined" color="primary" size="large">
            Volver
          </Button>
        </Link>
   

        <Button
          variant="outlined"
          color="success"
          size="large"
          onClick={exportToExcel}
        >
          Exportar a Excel
        </Button>
        </div>
       

        <div className="flex justify-center my-5">
          <Typography variant="h2">En produccion</Typography>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número de OT</TableCell>
              <TableCell>Cantidad de la OT</TableCell>
              <TableCell>Cliente </TableCell>
              <TableCell>Producto</TableCell>
              {Object.keys(groupedData).map((area, index) => (
                <TableCell key={index}>{area}</TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredOtNumbers.map((otNumber, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>{otNumber}</TableCell>
                <TableCell>
                  {data.find((item) => item.NumOT === otNumber)?.Cantidad}
                </TableCell>
                <TableCell>
                  {data.find((item) => item.NumOT === otNumber)?.NombreCliente}
                </TableCell>
                <TableCell>
                  {data.find((item) => item.NumOT === otNumber)?.Producto}
                </TableCell>

                {Object.entries(groupedData).map(([area, areaData], index) => {
                  const row = areaData.find((item) => item.NumOT === otNumber);
                  return (
                    <TableCell key={index}>
                      {row
                        ? Math.max(
                            0,
                            findPreviousStageProduccion(
                              row.NumOT,
                              row.ORDEN_VISUALIZACION,
                              row.Cantidad * 12
                            ) -
                              findPreviousStageProduccion(
                                row.NumOT,
                                row.ORDEN_VISUALIZACION + 1,
                                row.Cantidad * 12
                              )
                          )
                        : ""}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default MonitorOT;
