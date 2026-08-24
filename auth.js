// ==========================================
// MODO CLARO / MODO OSCURO (INDEX / GLOBAL)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('themeBtn');
    
    // Cargar preferencia guardada
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }

    // Inicializar lógica de pestañas si estamos en cuenta.html
    initCuentaTabs();
});

// ==========================================
// VALIDACIÓN DE RUT
// ==========================================
function validarRut(rutCompleto) {
    rutCompleto = rutCompleto.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    if (rutCompleto.length < 8) return false;

    let cuerpo = rutCompleto.slice(0, -1);
    let dv = rutCompleto.slice(-1);

    let suma = 0;
    let multiplo = 2;

    for (let i = 1; cuerpo.length >= i; i++) {
        let index = multiplo * rutCompleto.charAt(cuerpo.length - i);
        suma = suma + index;
        if (multiplo < 7) { multiplo = multiplo + 1; } else { multiplo = 2; }
    }

    let dvEsperado = 11 - (suma % 11);
    let dvFinal = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

    return dv === dvFinal;
}

// ==========================================
// PESTAÑAS Y TEXTO DE FONDO (cuenta.html)
// ==========================================
function initCuentaTabs() {
    const tabCuenta = document.getElementById('tab-cuenta');
    const tabSeguridad = document.getElementById('tab-seguridad');
    const seccionPerfil = document.getElementById('seccion-perfil');
    const seccionSeguridad = document.getElementById('seccion-seguridad');
    const contenedorTextoFondo = document.getElementById('texto-marquesina-fondo');

    if (!tabCuenta || !tabSeguridad) return;

    function actualizarTextoFondo(palabra) {
        if (!contenedorTextoFondo) return;
        contenedorTextoFondo.style.animation = 'none';
        contenedorTextoFondo.offsetHeight; 
        contenedorTextoFondo.style.animation = 'fadeInTextoFondo 0.5s ease-out forwards';

        let contenido = '';
        for (let i = 0; i < 14; i++) {
            contenido += `<span>${(palabra + ' ').repeat(15)}</span>\n`;
        }
        contenedorTextoFondo.innerHTML = contenido;
    }

    function cambiarPestaña(tabActiva, tabInactiva, seccionActiva, seccionInactiva, textoFondo) {
        tabActiva.classList.add('activo');
        tabInactiva.classList.remove('activo');
        
        const cursorActivo = tabActiva.querySelector('.cursorparpadea');
        const cursorInactivo = tabInactiva.querySelector('.cursorparpadea');
        
        if (cursorActivo) cursorActivo.style.display = 'inline-block';
        if (cursorInactivo) cursorInactivo.style.display = 'none';
        
        seccionInactiva.classList.remove('activo');
        
        setTimeout(() => {
            seccionInactiva.style.display = 'none';
            seccionActiva.style.display = 'block';
            
            setTimeout(() => {
                seccionActiva.classList.add('activo');
            }, 30);
        }, 200);

        actualizarTextoFondo(textoFondo);
    }
//cuenta
    actualizarTextoFondo('CUENTA');

    tabCuenta.addEventListener('click', () => {
        if (!seccionPerfil.classList.contains('activo')) {
            cambiarPestaña(tabCuenta, tabSeguridad, seccionPerfil, seccionSeguridad, 'CUENTA');
        }
    });

    tabSeguridad.addEventListener('click', () => {
        if (!seccionSeguridad.classList.contains('activo')) {
            cambiarPestaña(tabSeguridad, tabCuenta, seccionSeguridad, seccionPerfil, 'SEGURIDAD');
        }
    });
}