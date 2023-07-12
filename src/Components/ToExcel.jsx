import React from 'react';
import Button from '@mui/material/Button';
import * as XLSX from 'xlsx';

const ToExcel = ({ data, filenameByArea, sheetByArea }) => {
  const exportToExcel = () => {
    const workBook = XLSX.utils.book_new(); // Crear un nuevo workbook
    Object.entries(groupedData).forEach(([key, areaData]) => {
        const filteredRows = filterRows(areaData);
        const data = [['Número de OT', 'Nombre de cliente', 'Producto', 'Cantidad OT', 'Procesado', 'Cantidad a procesar', 'Merma']];
        filteredRows.forEach(row => {
            data.push([row.NumOT, row.NombreCliente, row.Producto, row.Cantidad, row.produccion || 0, findPreviousStageProduccion(row.NumOT, row.ORDEN_VISUALIZACION, row.Cantidad) - findPreviousStageProduccion(row.NumOT, row.ORDEN_VISUALIZACION + 1, row.Cantidad), row.merma]);
        });
        const workSheet = XLSX.utils.aoa_to_sheet(data); // Crear una hoja de cálculo con la información
        XLSX.utils.book_append_sheet(workBook, workSheet, sheetByArea[key]); // Agregar la hoja al libro
    });

    const workBookOutput = XLSX.write(workBook, { type: 'array', bookType: 'xlsx' }); // Escribir el libro como binario
    const blob = new Blob([workBookOutput], { type: 'application/octet-stream' });
    saveAs(blob, 'MonitorOTsActivas.xlsx'); // Guardar el archivo
};


  return (
    <div className="flex flex-row justify-end mb-4">
            <Button variant="contained" color="primary" onClick={exportToExcel}>
                Exportar a Excel
            </Button>
        </div>
  );
};

export default ToExcel;
