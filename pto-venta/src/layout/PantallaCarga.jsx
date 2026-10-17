import { useEffect, useState } from "react";

const MENSAJES = [
    "Revisando fichadas…",
    "Calculando jornadas…",
    "Sumando horas…",
    "Ajustando descansos…",
];

const MARCAS = Array.from({ length: 12 }, (_, i) => i * 30);

export default function PantallaCarga({ mensaje }) {
    const [indice, setIndice] = useState(0);

    useEffect(() => {
        if (mensaje) return; // si te pasan un mensaje fijo, no rota
        const id = setInterval(
            () => setIndice((prev) => (prev + 1) % MENSAJES.length),
            1800
        );
        return () => clearInterval(id);
    }, [mensaje]);

    const texto = mensaje ?? MENSAJES[indice];

    return (
        <div
            className="overlay-carga"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="carga-tarjeta">
                <div className="reloj">
                    <svg viewBox="0 0 120 120" className="reloj-svg" aria-hidden="true">
                        <circle className="reloj-pista" cx="60" cy="60" r="52" />
                        <circle className="reloj-progreso" cx="60" cy="60" r="52" />

                        {MARCAS.map((grados) => (
                            <line
                                key={grados}
                                className={`reloj-marca ${grados % 90 === 0 ? "reloj-marca-fuerte" : ""}`}
                                x1="60"
                                y1="14"
                                x2="60"
                                y2="19"
                                transform={`rotate(${grados} 60 60)`}
                            />
                        ))}

                        <line className="reloj-aguja" x1="60" y1="60" x2="60" y2="26" />
                        <circle className="reloj-centro" cx="60" cy="60" r="4" />
                    </svg>
                </div>

                <span className="carga-marca">A-Tiempo</span>

                <p key={texto} className="carga-mensaje">
                    {texto}
                </p>

                <div className="carga-jornada" aria-hidden="true">
                    <span className="tramo tramo-entrada" />
                    <span className="tramo tramo-descanso" />
                    <span className="tramo tramo-salida" />
                </div>
            </div>
        </div>
    );
}