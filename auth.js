function validarRut(rutCompleto) {
    // Limpiar el RUT de puntos y guiones
    rutCompleto = rutCompleto.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    if (rutCompleto.length < 8) return false;

    // Separar el cuerpo del dígito verificador
    let cuerpo = rutCompleto.slice(0, -1);
    let dv = rutCompleto.slice(-1);

    // Calcular el Dígito Verificador esperado
    let suma = 0;
    let multiplo = 2;

    for (let i = 1; cuerpo.length >= i; i++) {
        let index = multiplo * rutCompleto.charAt(cuerpo.length - i);
        suma = suma + index;
        if (multiplo < 7) { multiplo = multiplo + 1; } else { multiplo = 2; }
    }

    let dvEsperado = 11 - (suma % 11);
    dv = (dv == 'K') ? 10 : dv;
    dv = (dv == 0) ? 11 : dv;

    if (dvEsperado != dv) return false;
    return true;
}
// Función para CREAR CUENTA
function registrar() {
    const email = document.getElementById('login-email').value; // Asegúrate que el ID coincida con tu HTML
    const pass = document.getElementById('login-pass').value;

    firebase.auth().createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            alert("¡Cuenta de CYBERTILINES creada con éxito!");
        })
        .catch((error) => {
            alert("Error al registrar: " + error.message);
        });
}

// Función para INICIAR SESIÓN
function login() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            // Si todo sale bien, lo mandamos a tu página de reportes
            window.location.href = "paginaProyecto_CYBERTILINES.html"; 
        })
        .catch((error) => {
            alert("Usuario o contraseña incorrectos");
        });
}