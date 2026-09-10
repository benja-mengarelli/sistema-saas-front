import { createContext, useState, useEffect, useContext } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/firebase.config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [datos, setDatos] = useState(null);
    // Cada item: { id, rol, nombre, activo, ... } -- viene de users/{uid}/empresas
    const [empresas, setEmpresas] = useState([]);
    const [empresaActivaId, setEmpresaActivaId] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    setUser(user);
                    setCargando(true);

                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);
                    setDatos(docSnap.exists() ? docSnap.data() : null);

                    // A qué empresas pertenece
                    const empresasSnap = await getDocs(collection(db, "users", user.uid, "empresas"));
                    const listaEmpresas = empresasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    setEmpresas(listaEmpresas);

                    // Resolvemos la empresa activa EN LA MISMA PASADA (no en un
                    // efecto separado), para que cargando no baje a false hasta
                    // que rolActual/empresaActivaId también estén listos.
                    if (listaEmpresas.length === 0) {
                        setEmpresaActivaId(null);
                    } else if (listaEmpresas.length === 1) {
                        setEmpresaActivaId(listaEmpresas[0].id);
                    } else {
                        const guardada = localStorage.getItem(`empresaActiva:${user.uid}`);
                        const sigueSiendoValida = listaEmpresas.some((e) => e.id === guardada);
                        setEmpresaActivaId(sigueSiendoValida ? guardada : null);
                    }
                } else {
                    setUser(null);
                    setDatos(null);
                    setEmpresas([]);
                    setEmpresaActivaId(null);
                }
            } catch (e) {
                console.error("Error al cargar usuario:", e);
                setUser(null);
                setDatos(null);
                setEmpresas([]);
                setEmpresaActivaId(null);
            } finally {
                setCargando(false);
            }
        });

        return () => unsub();
    }, []);

    const cambiarEmpresaActiva = (empresaId) => {
        if (user) localStorage.setItem(`empresaActiva:${user.uid}`, empresaId);
        setEmpresaActivaId(empresaId);
    };

    const empresaActiva = empresas.find((e) => e.id === empresaActivaId) || null;

    const logout = () => signOut(auth);

    // Ejemplo de uso en el router/pantalla principal:
    //-   cargando                               -> loading/skeleton
    //-   !cargando && empresas.length === 0     -> pantalla "ingresar código"
    //-   !cargando && empresaActivaId === null  -> pantalla "elegí tu empresa" (solo pasa con 2+)
    //-   !cargando && empresaActivaId !== null  -> app normal, Navbar según rolActual

    return (
        <AuthContext.Provider
            value={{
                user,
                datos,
                empresas,
                empresaActivaId,
                empresaActiva,
                cambiarEmpresaActiva,
                cargando,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
