import { useState } from 'react';
import Modal from '../Modal';
import AbrirCajaForm from './AbrirCajaForm';
import CerrarCajaForm from './CerrarCajaForm';
import { formatoFechaHora, formatoPrecio } from '../../utils/formato';

export default function BarraCaja({ caja, resumen, onCambio }) {
    const [modal, setModal] = useState(null); // 'abrir' | 'cerrar' | null
    const [ocupado, setOcupado] = useState(false);

    const cerrarModal = () => { setOcupado(false); setModal(null); };
    const alAbrir = () => { cerrarModal(); onCambio(); };

    const abrirCierre = () => {
        onCambio(); // refresca los totales antes de contar
        setModal('cerrar');
    };

    return (
        <>
            {caja ? (
                <div className="barra-caja">
                    <span>
                        Caja abierta desde {formatoFechaHora(caja.fecha)} · inicial {formatoPrecio.format(caja.efectivo?.inicial || 0)}
                    </span>
                    <button type="button" className="btn-sec" onClick={abrirCierre}>Cerrar caja</button>
                </div>
            ) : (
                <div className="barra-caja barra-caja--aviso">
                    <span>No hay una caja abierta: no se puede cobrar.</span>
                    <button type="button" className="btn-prim" onClick={() => setModal('abrir')}>Abrir caja</button>
                </div>
            )}

            {modal === 'abrir' && (
                <Modal titulo="Abrir caja" cerrable={!ocupado} onCerrar={cerrarModal}>
                    <AbrirCajaForm onAbierta={alAbrir} onCancelar={cerrarModal} onOcupado={setOcupado} />
                </Modal>
            )}

            {modal === 'cerrar' && (
                <Modal titulo="Cerrar caja" cerrable={!ocupado} onCerrar={cerrarModal}>
                    <CerrarCajaForm
                        resumen={resumen}
                        onCerrada={onCambio}
                        onTerminar={cerrarModal}
                        onCancelar={cerrarModal}
                        onOcupado={setOcupado}
                    />
                </Modal>
            )}
        </>
    );
}