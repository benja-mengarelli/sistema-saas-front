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

                    //Lecturas en paralelo para establecer el user y su/s empresa/s
                    const [docSnap, empresasSnap] = await Promise.all([
                        getDoc(doc(db, "users", user.uid)),
                        getDocs(collection(db, "users", user.uid, "empresas")),
                    ]);

                    // Datos del usuario (nombre, uid, etc)
                    setDatos(docSnap.exists() ? docSnap.data() : null);

                    // A qué empresas pertenece
                    const listaEmpresas = empresasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    setEmpresas(listaEmpresas);

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
