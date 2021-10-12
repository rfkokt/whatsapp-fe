import React, {useContext, useState, useEffect, useRef} from 'react';
import {Table, Input, Button, Popconfirm, Form, message} from 'antd';
import moment from "moment";
import 'moment/locale/id'
import axios from "axios";
import ImportExcel from "./ImportExcel";

const EditableContext = React.createContext(null);

const EditableRow = ({index, ...props}) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

const EditableCell = ({
                          title,
                          editable,
                          children,
                          dataIndex,
                          record,
                          handleSave,
                          ...restProps
                      }) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef(null);
    const form = useContext(EditableContext);
    useEffect(() => {
        if (editing) {
            inputRef.current.focus();
        }
    }, [editing]);

    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({
            [dataIndex]: record[dataIndex],
        });
    };

    const save = async () => {
        try {
            const values = await form.validateFields();
            toggleEdit();
            handleSave({...record, ...values});
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };

    let childNode = children;

    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{
                    margin: 0,
                }}
                name={dataIndex}
                rules={[
                    {
                        required: true,
                        message: `${title} is required.`,
                    },
                ]}
            >
                <Input ref={inputRef} onPressEnter={save} onBlur={save}/>
            </Form.Item>
        ) : (
            <div
                className="editable-cell-value-wrap"
                style={{
                    paddingRight: 24,
                }}
                onClick={toggleEdit}
            >
                {children}
            </div>
        );
    }

    return <td {...restProps}>{childNode}</td>;
};

class EditableTable extends React.Component {
    constructor(props) {
        super(props);

        this.columns = [
            {
                title: 'No',
                dataIndex: "key",
            },
            {
                title: 'Nama',
                dataIndex: 'name',
                width: '30%',
                editable: true,
            },
            {
                title: 'Nomor Telepon',
                dataIndex: 'nomor',
                editable: true,
            },
            {
                title: 'Tanggal',
                dataIndex: 'tanggal',
            },
            {
                title: 'Kirim Pesan',
                dataIndex: 'send',
                render: (_, record) => (
                    <>
                        <Button
                            onClick={() => this.sendMessage(record, true)}
                            type="primary"
                            style={{
                                marginBottom: 16,
                            }}
                        >Kirim</Button>
                        &nbsp;
                        <Button
                            onClick={() => this.sendMessage(record, false)}
                            type="danger"
                            style={{
                                marginBottom: 16,
                            }}
                        >Reschedule</Button>
                    </>
                )
            },
            {
                title: 'Aksi',
                dataIndex: 'operation',
                render: (_, record) =>
                    this.state.dataSource.length >= 1 ? (
                        <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDelete(record.key)}>
                            <a>Delete</a>
                        </Popconfirm>
                    ) : null,
            },
        ];
        this.state = {
            dataSource: [],
            count: 0,
        };
    }

    handleDelete = (key) => {
        const dataSource = [...this.state.dataSource];
        this.setState({
            dataSource: dataSource.filter((item) => item.key !== key),
        });
    };
    handleAdd = () => {
        const {count, dataSource} = this.state;
        const newData = {
            key: count + 1,
            name: `Nama ${count}`,
            nomor: '08xxx',
            tanggal: moment().add(1, 'days').format("dddd,Do MMMM YYYY")
        };
        this.setState({
            dataSource: [...dataSource, newData],
            count: count + 1,
        });
    };
    handleSave = (row) => {
        const newData = [...this.state.dataSource];
        const index = newData.findIndex((item) => row.key === item.key);
        const item = newData[index];
        newData.splice(index, 1, {...item, ...row});
        this.setState({
            dataSource: newData,
        });
    };

    sendMessage = (e, sekarang) => {
        const url = `http://localhost:8000/send-message`
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Access-Control-Allow-Origin': '*',
            }
        }
        const params = new URLSearchParams()
        // params.append('sender', 'Ridho')
        params.append('number', `${e.nomor}`)
        params.append('message', sekarang ? `Selamat malam. Kami poli gigi Puskesmas Kecamatan Jatinegara ingin menginformasikan atas nama *${e.name}* sudah terdaftar sebagai pasien reservasi pada hari *${e.tanggal}*.
Untuk pendaftaran diloket dimulai pukul 07.30-09.00, nomer antrian disesuaikan dgn kedatangan. Demikian informasi yg kami sampaikan. Terima kasih, Salam Sehat🙏🏻☺️

*Note :*
- Pelayanan tindakan gigi sesuai dgn no urut kedatangan pasien
- Sebelum dilakukan tindakan gigi pasien akan di swab antigen secara Gratis di ruang layanan gigi
- Setiap pasien Wajib membawa/mengirim (WA) foto gigi yg di keluhkan di hp` :
            `Selamat malam. Kami poli gigi Puskesmas Kecamatan Jatinegara ingin menginformasikan atas nama *${e.name}* sudah terdaftar sebagai pasien reservasi pada hari *${e.tanggal}*.
Mohon maaf tidak sesuai dengan jadwal yang diinginkan karena kouta pada hari tersebut sudah full 12 pasien🙏🏻
Untuk pendaftaran diloket dimulai pukul 07.30-09.00, nomer antrian disesuaikan dgn kedatangan. Demikian informasi yg kami sampaikan. Terima kasih, Salam Sehat🙏🏻☺️

*Note :*
- Pelayanan tindakan gigi sesuai dgn no urut kedatangan pasien
- Sebelum dilakukan tindakan gigi pasien akan di swab antigen secara Gratis di ruang layanan gigi
- Setiap pasien Wajib membawa/mengirim (WA) foto gigi yg di keluhkan di hp`)
        axios.post(url, params, config)
            .then((data) => {
                if (data.data.status) {
                    message.success(`Pesan berhasil dikirim ke nomor ${e.nomor} dengan nama ${e.name}`);
                    const dataSource = [...this.state.dataSource];
                    this.setState({
                        dataSource: dataSource.filter((item) => item.key !== e.key),
                    });
                } else {
                    const hide = message.error(`Pesan gagal dikirim ke nomor ${e.nomor}`);
                    setTimeout(hide, 2500);
                }
            }).catch((err) => {
            if (err) {
                const hide = message.error(`Pesan gagal dikirim ke nomor ${e.nomor} karena nomor tidak terdaftar`);
                setTimeout(hide, 2500);
            }
        })

    }


    sendMessageAll = (sekarang) => {
        this.state.dataSource.map((item) => {


            const url = `http://localhost:8000/send-message`
            const config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Access-Control-Allow-Origin': '*',
                }
            }
            const params = new URLSearchParams()
            // params.append('sender', 'Ridho')
            params.append('number', `${item.nomor}`)
            params.append('message', sekarang ? `Selamat malam. Kami poli gigi Puskesmas Kecamatan Jatinegara ingin menginformasikan atas nama *${item.name}* sudah terdaftar sebagai pasien reservasi pada hari *${item.tanggal}*.
Untuk pendaftaran diloket dimulai pukul 07.30-09.00, nomer antrian disesuaikan dgn kedatangan. Demikian informasi yg kami sampaikan. Terima kasih, Salam Sehat🙏🏻☺️

*Note :*
- Pelayanan tindakan gigi sesuai dgn no urut kedatangan pasien
- Sebelum dilakukan tindakan gigi pasien akan di swab antigen secara Gratis di ruang layanan gigi
- Setiap pasien Wajib membawa/mengirim (WA) foto gigi yg di keluhkan di hp` :
                `Selamat malam. Kami poli gigi Puskesmas Kecamatan Jatinegara ingin menginformasikan atas nama *${item.name}* sudah terdaftar sebagai pasien reservasi pada hari *${item.tanggal}*.
Mohon maaf tidak sesuai dengan jadwal yang diinginkan karena kouta pada hari tersebut sudah full 12 pasien🙏🏻
Untuk pendaftaran diloket dimulai pukul 07.30-09.00, nomer antrian disesuaikan dgn kedatangan. Demikian informasi yg kami sampaikan. Terima kasih, Salam Sehat🙏🏻☺️

*Note :*
- Pelayanan tindakan gigi sesuai dgn no urut kedatangan pasien
- Sebelum dilakukan tindakan gigi pasien akan di swab antigen secara Gratis di ruang layanan gigi
- Setiap pasien Wajib membawa/mengirim (WA) foto gigi yg di keluhkan di hp`)
            axios.post(url, params, config)
                .then((data) => {
                    if (data.data.status) {
                        message.success(`Pesan berhasil dikirim ke nomor ${item.nomor} dengan nama ${item.name}`);
                    } else {
                        const hide = message.error(`Pesan gagal dikirim ke nomor ${item.nomor}`);
                        setTimeout(hide, 2500);
                    }
                }).catch((err) => {
                if (err) {
                    const hide = message.error(`Pesan gagal dikirim ke nomor ${item.nomor} karena nomor tidak terdaftar`);
                    setTimeout(hide, 2500);
                }
            })
        })
    }

    getDataSource = (e) => {
        this.setState({
            dataSource: e
        })
    }

    kosongkanData = () => {
        this.setState({
            dataSource: []
        })
    }

    render() {
        const {dataSource} = this.state;
        console.log('testing muncuul gk')
        const components = {
            body: {
                row: EditableRow,
                cell: EditableCell,
            },
        };
        const columns = this.columns.map((col) => {
            if (!col.editable) {
                return col;
            }

            return {
                ...col,
                onCell: (record) => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave,
                }),
            };
        });
        return (
            <div>
                <Button
                    onClick={this.handleAdd}
                    type="primary"
                    style={{
                        marginBottom: 16,
                    }}
                >
                    Tambah Penerima Pesan
                </Button>
                &nbsp;
                <Button
                    onClick={this.kosongkanData}
                    type="danger"
                    style={{
                        marginBottom: 16,
                    }}
                >
                    Kosongkan
                </Button>
                <ImportExcel dataSource={this.getDataSource.bind(this)}/>
                <Table
                    components={components}
                    rowClassName={() => 'editable-row'}
                    bordered
                    dataSource={dataSource}
                    columns={columns}
                />
                <br/>
                <Button
                    onClick={() => this.sendMessageAll(true)}
                    type="primary"
                    style={{
                        marginBottom: 16,
                    }}
                >Kirim Semua</Button> &nbsp;
                <Button
                    onClick={() => this.sendMessageAll(false)}
                    type="danger"
                    style={{
                        marginBottom: 16,
                    }}
                >Reschedule Semua</Button>
            </div>
        );
    }
}

export default EditableTable