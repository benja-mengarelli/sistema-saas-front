import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { auth } from "../firebase/firebase.config";
import { useAuth } from "./authContext";

const OperadorContext = createContext();

const DURACION_SESION_MS = 5 * 60 * 1000; // 5 minutos

export const OperadorProvider = ({ children }) => {
    const { empresaActivaId } = useAuth();
    const [operador, setOperador] = useState(null); // { nombre, rol, codigoId }
    const [validandoCodigo, setValidandoCodigo] = useState(false);
    const [errorCodigo, setErrorCodigo] = useState(null);

    const timeoutRef = useRef(null);

    const cerrarSesionOperador = useCallback(() => {
        setOperador(null);
        setErrorCodigo(null);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    // Cambió la empresa activa -> la sesión de operador de la empresa
    // anterior no tiene sentido acá.
    useEffect(() => {
        cerrarSesionOperador();
    }, [empresaActivaId, cerrarSesionOperador]);

    const programarExpiracion = useCallback((ms) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(cerrarSesionOperador, ms);
    }, [cerrarSesionOperador]);

    const ingresarCodigo = async (codigo) => {
        setValidandoCodigo(true);
        setErrorCodigo(null);
        try {
            const idToken = await auth.currentUser.getIdToken();
            const res = await fetch(
                `${API_URL}/empresas/${empresaActivaId}/operadores/validar-codigo`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({ codigo }),
                }
            );

            if (!res.ok) {
                const { mensaje } = await res.json().catch(() => ({}));
                throw new Error(mensaje || "Código inválido");
            }

            const data = await res.json(); // { nombre, rol, codigoId, expiraEnSegundos }
            setOperador({ nombre: data.nombre, rol: data.rol, codigoId: data.codigoId });
            programarExpiracion(data.expiraEnSegundos * 1000);
            return true;
        } catch (e) {
            setErrorCodigo(e.message);
            return false;
        } finally {
            setValidandoCodigo(false);
        }
    };

    // Llamar esto cada vez que el backend responda OK a una acción del
    // operador, para "deslizar" la ventana de 5 minutos con la actividad real.
    const refrescarSesion = useCallback((expiraEnSegundos) => {
        if (!operador) return;
        programarExpiracion(expiraEnSegundos * 1000);
    }, [operador, programarExpiracion]);

    useEffect(() => () => timeoutRef.current && clearTimeout(timeoutRef.current), []);

    return (
        <OperadorContext.Provider
            value={{
                operador,
                haySesionOperador: !!operador,
                rolOperador: operador?.rol || null,
                validandoCodigo,
                errorCodigo,
                ingresarCodigo,
                cerrarSesionOperador,
                refrescarSesion,
            }}
        >
            {children}
        </OperadorContext.Provider>
    );
};

export const useOperador = () => useContext(OperadorContext);