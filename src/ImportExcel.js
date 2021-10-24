import React, {Component} from 'react';
import {message, Table, Tabs} from "antd";
import XLSX from "xlsx";
// import './utils/style.css'
import moment from "moment";

const {TabPane} = Tabs;

class ImportExcel extends Component {
    constructor() {
        super();
        this.state = {
            result: [],
            sheets: [],
            barangDikirimBB: [],
            sheetsName: [],
            dataValidasi: []
        }
    }


    handleFile = (file /*:File*/) => {
        /* Boilerplate to set up FileReader */
        const reader = new FileReader();
        const rABS = !!reader.readAsBinaryString;
        const source = {name: file.name, type: file.type};
        reader.onload = e => {
            /* Parse data */
            const bstr = e.target.result;
            const wb = XLSX.read(bstr, {type: rABS ? "binary" : "array"});
            /* Get first worksheet */
            const sheets = wb.SheetNames.map((name) => {
                let first_worksheet = wb.Sheets[name];
                let data = XLSX.utils
                    .sheet_to_json(first_worksheet, {header: 1})
                    .filter((row) => row.length > 0);
                return {source, name, data};
            });
            const result = {...source, sheets}
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            /* Convert array of arrays */
            const data = XLSX.utils.sheet_to_json(ws, {header: 1});
            /* Update state */
            this.setState({
                result: result,
                sheets: result.sheets,
                sheetsName: wb.SheetNames
            }, () => {
                this.getDataExcel()
            })
            // this.setState({data: data, cols: make_cols(ws["!ref"])});
        };
        if (rABS) reader.readAsBinaryString(file);
        else reader.readAsArrayBuffer(file);
    }

    handleChange = (e) => {
        const files = e.target.files;
        this.handleFile(files[0])
    }

    getDataExcel = () => {
        const dataSource = []
        const tanggal = this.state.sheets
        const tanggalInput= tanggal[0].data[2]
        this.state.sheets.map((item, index) => {
            item.data.slice(4).map((i, x) => {
                dataSource.push({
                    "key": x + 1,
                    "name": i[1],
                    "nomor": i[3],
                    "tanggal": tanggalInput,
                })
            })
            this.setState({
                dataSource
            }, () => {
                this.props.dataSource(dataSource)
            })
        })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.kirimExport !== this.props.kirimExport) {
            this.setState({
                idIzinTransTPB: this.props.idIzinTransTPB
            }, () => {
                this.submitData()
            })
        }
        if (this.props.batal) {
            this.setState({
                barangDikirimBB: [],
                barangDikirimTarif: [],
                bahanBakuDikirim: [],
                bahanBakuDikirimTarif: [],
                barangMasuk: [],
                barangSisa: [],
                barangTambah: [],
                konversi: [],
                barangDiKeluarkanKembali: [],
                sheetsName: []
            }, () => {
                this.props.batalNew(false)
            })
        }
    }


    render() {
        return (
            <div>
                <div className="form-group">
                    <label htmlFor="file">Upload File Excel &nbsp;</label>
                    <input
                        type="file"
                        className="form-control"
                        id="file"
                        accept={SheetJSFT}
                        onChange={this.handleChange}
                    />
                </div>
            </div>
        );
    }
}

const SheetJSFT = [
    "xlsx",
    "xlsb",
    "xlsm",
    "xls",
    "xml",
    "csv",
    "txt",
    "ods",
    "fods",
    "uos",
    "sylk",
    "dif",
    "dbf",
    "prn",
    "qpw",
    "123",
    "wb*",
    "wq*",
    "html",
    "htm"
]
    .map(function (x) {
        return "." + x;
    })
    .join(",");

export default ImportExcel;
