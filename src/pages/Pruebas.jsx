import {
  Button,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";

import * as XLSX from "xlsx";

const MonitorOT = () => {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const fetchOtDetalles = async () => {
    const res = await fetch("http://internal-a032771aed78c4f10b69ab42863f3f1c-972419124.us-east-1.elb.amazonaws.com/historico");
    const data = await res.json();
    console.log(data);
    setData(data);
  };
  useEffect(() => {
    fetchOtDetalles();
  }, []);

  const cerrarArea = async (Num_OT, Codigo_Area, DESCRIPCION_AREA) => {
    const confirmation = await Swal.fire({
      title: `¿Estás seguro de que deseas cerrar la OT ${Num_OT} en el área de ${DESCRIPCION_AREA} ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(
       "http://internal-a032771aed78c4f10b69ab42863f3f1c-972419124.us-east-1.elb.amazonaws.com/updateTerminada",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ Num_OT, Codigo_Area }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log(data.message);
        fetchOtDetalles(); // Actualiza los datos después de cerrar el área
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const groupedData = useMemo(() => {
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.DESCRIPCION_AREA]) {
        acc[item.DESCRIPCION_AREA] = {
          data: [],
          ordenVisualizacion: item.ORDEN_VISUALIZACION,
        };
      }
      acc[item.DESCRIPCION_AREA].data.push(item);
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
      return (Cantidad / 24).toFixed(0);
    }
    const shouldMultiplyBy12 = currentAreaOrdenVisualizacion <= 3;

    const previousArea = Object.values(groupedData).find(
      (area) =>
        area[0].ORDEN_VISUALIZACION === currentAreaOrdenVisualizacion - 1
    );
    if (previousArea) {
      const previousStage = previousArea.find((item) => item.NumOT === NumOT);
      if (previousStage) {
        return previousStage.produccion || 0;
      }
    }
    return 0;
  };

  const filterRows = (rows) => {
    return rows.filter(
      (row) =>
        findPreviousStageProduccion(
          row.NumOT,
          row.ORDEN_VISUALIZACION,
          row.Cantidad,
          row.ORDEN_VISUALIZACION === 1
        ) > 0 && row.estadoOT !== 1
    );
  };

  const filenameByArea = useMemo(() => {
    const filenames = {};
    for (const key in groupedData) {
      filenames[key] = `${key.replace(/\s/g, "_")}MonitoreoOT`;
    }
    return filenames;
  }, [groupedData]);

  const sheetByArea = useMemo(() => {
    const sheetNames = {};
    for (const key in groupedData) {
      sheetNames[key] = `${key.replace(/\s/g, "_")}`;
    }
    return sheetNames;
  }, [groupedData]);

  const exportToExcel = () => {
    const workBook = XLSX.utils.book_new(); // Crear un nuevo workbook
    Object.entries(groupedData).forEach(([key, areaData]) => {
      const filteredRows = filterRows(areaData);
      const data = [
        [
          "Número de OT",
          "Nombre de cliente",
          "Producto",
          "Cantidad OT",
          "Procesado",
          "Cantidad a procesar",
          "Merma",
        ],
      ];
      filteredRows.forEach((row) => {
        data.push([
          row.NumOT,
          row.NombreCliente,
          row.Producto,
          row.Cantidad,
          row.produccion * 12 || 0,
          Math.max(
            0,
            findPreviousStageProduccion(
              row.NumOT,
              row.ORDEN_VISUALIZACION,
              row.Cantidad
            ) -
              findPreviousStageProduccion(
                row.NumOT,
                row.ORDEN_VISUALIZACION + 1,
                row.Cantidad
              )
          ) * 12,
          row.merma,
        ]);
      });
      const workSheet = XLSX.utils.aoa_to_sheet(data); // Crear una hoja de cálculo con la información
      XLSX.utils.book_append_sheet(workBook, workSheet, sheetByArea[key]); // Agregar la hoja al libro
    });

    const workBookOutput = XLSX.write(workBook, {
      type: "array",
      bookType: "xlsx",
    }); // Escribir el libro como binario
    const blob = new Blob([workBookOutput], {
      type: "application/octet-stream",
    });
    saveAs(blob, "MonitorOTsActivas.xlsx"); // Guardar el archivo
  };
  return (
    <>
      <div className="flex justify-between mx-5 mt-5">
        <div>
          <Link className="mr-2" to="/tabla">
            <Button
              className="mr-2"
              size="large"
              variant="outlined"
              color="primary"
            >
              Ver tabla
            </Button>
          </Link>

          <Button
            className="mx-2"
            variant="outlined"
            size="large"
            color="success"
            onClick={exportToExcel}
          >
            Exportar a Excel
          </Button>
        </div>
        <Link to="/OTS">
          {" "}
          <Button variant="contained" color="primary">
            Necesitas consultar por una OT especifica?
          </Button>
        </Link>
      </div>

      <div className="flex justify-center">
        <Typography variant="h2">Monitor de OT</Typography>
      </div>
      <div className="flex flex-col items-center justify-center mt-5 p-2">
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => {
            setActiveTab(newValue);
          }}
        >
          {Object.keys(groupedData).map((Codigo_Area, index) => (
            <Tab label={Codigo_Area} key={index} />
          ))}
        </Tabs>

        {Object.entries(groupedData).map(([Codigo_Area, areaData], index) => (
          <div hidden={activeTab !== index} key={index}>
            {areaData.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número de OT</TableCell>
                    <TableCell>Nombre de cliente</TableCell>
                    <TableCell>Cantidad OT</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Procesado</TableCell>
                    <TableCell>Cantidad a procesar</TableCell>
                    <TableCell>Merma</TableCell>
                    <TableCell>Cerrar Area</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterRows(areaData).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell>{row.NumOT}</TableCell>
                      <TableCell>{row.NombreCliente}</TableCell>
                      <TableCell>{row.Cantidad}</TableCell>
                      <TableCell>{row.Producto}</TableCell>
                      <TableCell>
                        {row.produccion}
                        {/* Cambiar esta línea */}
                      </TableCell>
                      <TableCell>
                        {Math.max(
                          0,
                          findPreviousStageProduccion(
                            row.NumOT,
                            row.ORDEN_VISUALIZACION,
                            row.Cantidad
                          ) -
                            findPreviousStageProduccion(
                              row.NumOT,
                              row.ORDEN_VISUALIZACION + 1,
                              row.Cantidad
                            )
                        ) * (row.ORDEN_VISUALIZACION === 4 ? 24 : 1)}

                        {/* Cambiar esta línea */}
                      </TableCell>

                      <TableCell>{row.merma}</TableCell>
                      <TableCell>
                        <Button variant="contained" color="error"
                          onClick={() =>
                            cerrarArea(
                              row.NumOT,
                              row.Codigo_Area,
                              row.DESCRIPCION_AREA
                            )
                          }
                        >
                          Cerrar OT
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No hay datos disponibles.</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default MonitorOT;
