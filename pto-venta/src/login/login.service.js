import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export const login = (email, pass) => {
    return signInWithEmailAndPassword(auth, email, pass);
}

export const register = async (nombre, email, pass) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "users", cred.user.uid), {
        nombre: nombre,
        imagen: imagen,
        activo: true
        //(rol queda guardado en empresas/{id}/miembros y en
        // users/{uid}/empresas/{id}). Un usuario recién creado no tiene
        // ninguna empresa todavía, así que no tiene sentido un rol global.

    });
    return cred;
};