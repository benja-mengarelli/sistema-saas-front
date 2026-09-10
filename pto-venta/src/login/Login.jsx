import { useState } from "react";
import { login, register } from "../../services/auth.service";



export default function LoginPopUp() {
    const [modoRegistro, setModoRegistro] = useState(false);
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState(null);
    const [imagen, setImagen] = useState("/img/usuario.png")
    const [cargandoAuth, setCargandoAuth] = useState(false);

    const options = [
    { id: "b", src: "/img/usuario.png", label: "Opción B" },
    { id: "a", src: "/img/adm-v2.png", label: "Opción A" },
    { id: "c", src: "/img/usuario2.png", label: "Opción C" },
    { id: "d", src: "/img/usuario3.png", label: "Opción D" },
    { id: "e", src: "/img/usuario4.png", label: "Opción E" }
];

    const hacerLogin = async () => {
        try {
            setCargandoAuth(true);
            await login(email, pass);
        } catch (e) {
            setError(e.message);
            alert("Error al iniciar sesión: " + e.message);
        } finally {
            setCargandoAuth(false);
        }
    };

    const hacerRegistro = async () => {
        try {
            setCargandoAuth(true);
            await register(nombre, email, pass, imagen);
        } catch (e) {
            setError(e.message);
            alert("Error al registrar usuario: " + e.message);
        } finally {
            setCargandoAuth(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        modoRegistro ? hacerRegistro() : hacerLogin();
    };


    return (
        <div className="modal-fondo">
            <div className="modal-caja">
                <h2>{modoRegistro ? "Registrarse" : "Iniciar Sesión"}</h2>

                <form onSubmit={handleSubmit}>
                    {modoRegistro && (
                        <input
                            type="text"
                            placeholder="Nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required minLength={1} maxLength={8}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        required minLength={6} maxLength={12}
                    />
                    {modoRegistro && (
                        <div className="imagen-login">
                        {options.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                className={imagen === opt.src ? "seleccionada" : "none"}
                                onClick={() => setImagen(opt.src)}
                            >
                                <img src={opt.src} alt={opt.label} style={{width: "50px", height: "50px"}} />
                            </button>
                        ))}
                    </div>
                    )}
                    

                    {error && <p className="error">{error}</p>}

                    <button type="submit" className="btn-login">
                        {modoRegistro ? "Crear cuenta" : "Entrar"}
                    </button>
                </form>

                <p className="link" onClick={() => setModoRegistro(!modoRegistro)}>
                    {modoRegistro
                        ? "¿Ya tenés cuenta? Iniciar sesión"
                        : "¿No tenés cuenta? Registrate acá"}
                </p>
            </div>
        </div>
    );
}