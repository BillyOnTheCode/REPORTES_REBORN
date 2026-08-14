import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    EmailAuthProvider, 
    reauthenticateWithCredential, 
    updatePassword,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence 
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    updateDoc, 
    setDoc, 
    collection, 
    addDoc, 
    serverTimestamp, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

// Configuración de EmailJS
const EMAILJS_PUBLIC_KEY = "Fdr9w_UZ6HPs_dxC0";
const EMAILJS_SERVICE_ID = "service_u15cewk";
const EMAILJS_TEMPLATE_ID = "template_xbxkyjk";

if (window.emailjs && EMAILJS_PUBLIC_KEY !== "TU_PUBLIC_KEY") {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCybJ3x7mCXGoX_QvX-lww8DNsxCMl_jrc",
    authDomain: "proyectopaginacybertilines.firebaseapp.com",
    projectId: "proyectopaginacybertilines",
    storageBucket: "proyectopaginacybertilines.firebasestorage.app",
    messagingSenderId: "515231457085",
    appId: "1:515231457085:web:82cfc9620965f170036f54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Funciones auxiliares generales
function extraerNombreDesdeCorreo(correo) {
    if (!correo) return "Usuario CyberTilines";
    const parteUsuario = correo.split("@")[0];
    const fragmentos = parteUsuario.split(".");
    const nombreRaw = fragmentos[0] || "";
    const apellidoRaw = fragmentos[1] || "";

    const nombreFormateado = nombreRaw.charAt(0).toUpperCase() + nombreRaw.slice(1);
    const apellidoFormateado = apellidoRaw.charAt(0).toUpperCase() + apellidoRaw.slice(1);

    return `${nombreFormateado} ${apellidoFormateado}`.trim();
}

function validarRut(rut) {
    const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
    if (rutLimpio.length < 8) return false;
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);
    let suma = 0, multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += multiplo * cuerpo.charAt(i);
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    const dvEsperado = 11 - (suma % 11);
    let dvFinal = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();
    return dv === dvFinal;
}

function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
}

function closeMenuIfExists() {
    const navPanel = document.getElementById("navPanel");
    const navOverlay = document.getElementById("navOverlay");
    if (navPanel) navPanel.classList.remove("is-open");
    if (navOverlay) navOverlay.classList.remove("is-open");
    document.body.style.overflow = "";
}

// Inicialización de eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    
    // LÓGICA VISTA CUENTA.HTML
    if (document.body.classList.contains("cuerpocuenta")) {
        const userDisplayName = document.getElementById('user-display-name');
        const userSmallUsername = document.getElementById('user-small-username');
        const userDisplayEmail = document.getElementById('user-display-email');
        const avatarLetra = document.getElementById('avatar-letra');
        const userUsernameInput = document.getElementById('userUsername');
        const userBioInput = document.getElementById('userBio');
        const msgGuardado = document.getElementById('msg-guardado');
        const inputArchivoFoto = document.getElementById('input-archivo-foto');
        const loadingScreen = document.getElementById('loading-screen-cuenta');
        const btnCambiarPortada = document.getElementById('btn-cambiar-portada');
        const inputArchivoPortada = document.getElementById('input-archivo-portada');
        const bannerPreview = document.getElementById('banner-preview');
        const passActualInput = document.getElementById('passActual');
        const passNuevaInput = document.getElementById('passNueva');
        const passConfirmarInput = document.getElementById('passConfirmar');
        const btnGuardarSeguridad = document.getElementById('btnGuardarSeguridad');
        const msgSeguridad = document.getElementById('msg-seguridad');
        const modalRecorte = document.getElementById('modal-recorte');
        const imagenARecortar = document.getElementById('imagen-a-recortar');
        const btnCancelarCorte = document.getElementById('btn-cancelar-corte');
        const btnGuardarCorte = document.getElementById('btn-guardar-corte');
        const modalRecorteBanner = document.getElementById('modal-recorte-banner');
        const imagenARecortarBanner = document.getElementById('imagen-a-recortar-banner');
        const btnCancelarCorteBanner = document.getElementById('btn-cancelar-corte-banner');
        const btnGuardarCorteBanner = document.getElementById('btn-guardar-corte-banner');

        let cropper = null; 
        let cropperBanner = null;
        let userDocRef = null;
        let uidUsuarioActual = null;
        let nombreArchivoOriginal = "";
        let nombreArchivoPortada = "";
        let usuarioActual = null;

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                usuarioActual = user;
                uidUsuarioActual = user.uid;
                userDocRef = doc(db, "usuarios", user.uid);
                
                if (userDisplayEmail) userDisplayEmail.innerText = user.email || "";
                
                try {
                    const snap = await getDoc(userDocRef);
                    if (snap.exists()) {
                        const userData = snap.data();
                        if (userDisplayName) userDisplayName.innerText = userData.nombreReal || "Usuario sin nombre";
                        
                        if (userSmallUsername) {
                            userSmallUsername.innerText = (userData.username && userData.username.trim() !== "") ? `(${userData.username.trim()})` : "";
                        }

                        if (userUsernameInput) userUsernameInput.value = userData.username || "";
                        if (userBioInput) userBioInput.value = userData.bio || "";
                        
                        if (avatarLetra) {
                            if (userData.fotoPerfilUrl) {
                                avatarLetra.innerText = ""; 
                                avatarLetra.style.backgroundImage = `url('${userData.fotoPerfilUrl}')`;
                            } else if (userData.nombreReal) {
                                avatarLetra.style.backgroundImage = "none";
                                avatarLetra.innerText = userData.nombreReal.charAt(0).toUpperCase();
                            }
                        }

                        if (bannerPreview) {
                            bannerPreview.style.backgroundImage = userData.fotoPortadaUrl 
                                ? `url('${userData.fotoPortadaUrl}')` 
                                : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";
                        }
                    } else if (userDisplayName) {
                        userDisplayName.innerText = "Error: Perfil no registrado";
                    }
                } catch (error) {
                    console.error("Error al obtener Firestore:", error);
                    if (userDisplayName) userDisplayName.innerText = "Error al conectar con la base de datos";
                } finally {
                    if (loadingScreen) {
                        loadingScreen.style.opacity = '0';
                        loadingScreen.style.visibility = 'hidden';
                        setTimeout(() => { loadingScreen.style.display = 'none'; }, 400);
                    }
                }
            } else {
                window.location.href = "index.html";
            }
        });

        if (btnCambiarPortada && inputArchivoPortada) {
            btnCambiarPortada.addEventListener('click', () => inputArchivoPortada.click());
            inputArchivoPortada.addEventListener('change', (e) => {
                const archivo = e.target.files[0];
                if (!archivo) return;
                nombreArchivoPortada = archivo.name;
                const lector = new FileReader();
                lector.onload = function(evento) {
                    imagenARecortarBanner.src = evento.target.result;
                    modalRecorteBanner.style.display = "flex";
                    if (cropperBanner) cropperBanner.destroy();
                    cropperBanner = new Cropper(imagenARecortarBanner, {
                        aspectRatio: 700 / 430,
                        viewMode: 2,      
                        background: false,
                        autoCropArea: 1,  
                        responsive: true,
                        checkCrossOrigin: false
                    });
                };
                lector.readAsDataURL(archivo);
            });
        }

        if (btnCancelarCorteBanner) {
            btnCancelarCorteBanner.addEventListener('click', () => {
                modalRecorteBanner.style.display = "none";
                if (cropperBanner) cropperBanner.destroy();
                inputArchivoPortada.value = "";
            });
        }

        if (btnGuardarCorteBanner) {
            btnGuardarCorteBanner.addEventListener('click', () => {
                if (!cropperBanner || !uidUsuarioActual) return;
                const canvasRecortado = cropperBanner.getCroppedCanvas({ width: 700, height: 430 });
                modalRecorteBanner.style.display = "none";
                cropperBanner.destroy();

                msgGuardado.style.color = "#ffcc00";
                msgGuardado.innerText = "Subiendo foto de portada ajustada...";

                canvasRecortado.toBlob(async (blob) => {
                    if (!blob) {
                        msgGuardado.style.color = "#ff4444";
                        msgGuardado.innerText = "Error al procesar el recorte de portada.";
                        return;
                    }
                    const rutaPortada = ref(storage, `banners/${uidUsuarioActual}/cropped_${nombreArchivoPortada}`);
                    try {
                        const resultadoSubida = await uploadBytes(rutaPortada, blob);
                        const urlDescarga = await getDownloadURL(resultadoSubida.ref);
                        await updateDoc(userDocRef, { fotoPortadaUrl: urlDescarga });
                        bannerPreview.style.backgroundImage = `url('${urlDescarga}')`;
                        msgGuardado.style.color = "#00ff88";
                        msgGuardado.innerText = "¡Foto de portada ajustada y guardada con éxito!";
                        setTimeout(() => { msgGuardado.innerText = ""; }, 3000);
                    } catch (err) {
                        console.error("Error al subir portada:", err);
                        msgGuardado.style.color = "#ff4444";
                        msgGuardado.innerText = "Error al guardar la foto de portada.";
                    } finally {
                        inputArchivoPortada.value = "";
                    }
                }, "image/jpeg", 0.92);
            });
        }

        if (inputArchivoFoto) {
            inputArchivoFoto.addEventListener('change', (e) => {
                const archivo = e.target.files[0];
                if (!archivo) return;
                nombreArchivoOriginal = archivo.name;
                const lector = new FileReader();
                lector.onload = function(evento) {
                    imagenARecortar.src = evento.target.result;
                    modalRecorte.style.display = "flex"; 
                    if (cropper) cropper.destroy();
                    cropper = new Cropper(imagenARecortar, {
                        aspectRatio: 1, 
                        viewMode: 1,    
                        background: false,
                        autoCropArea: 1,
                        responsive: true
                    });
                };
                lector.readAsDataURL(archivo);
            });
        }

        if (btnCancelarCorte) {
            btnCancelarCorte.addEventListener('click', () => {
                modalRecorte.style.display = "none";
                if (cropper) cropper.destroy();
                inputArchivoFoto.value = ""; 
            });
        }

        if (btnGuardarCorte) {
            btnGuardarCorte.addEventListener('click', () => {
                if (!cropper || !uidUsuarioActual) return;
                const canvasRecortado = cropper.getCroppedCanvas({ width: 400, height: 400 });
                modalRecorte.style.display = "none";
                cropper.destroy();

                msgGuardado.style.color = "#ffcc00";
                msgGuardado.innerText = "Subiendo imagen ajustada...";

                canvasRecortado.toBlob(async (blob) => {
                    if (!blob) {
                        msgGuardado.style.color = "#ff4444";
                        msgGuardado.innerText = "Error al procesar el recorte.";
                        return;
                    }
                    const rutaAlmacenamiento = ref(storage, `avatars/${uidUsuarioActual}/cropped_${nombreArchivoOriginal}`);
                    try {
                        const resultadoSubida = await uploadBytes(rutaAlmacenamiento, blob);
                        const urlDescarga = await getDownloadURL(resultadoSubida.ref);
                        await updateDoc(userDocRef, { fotoPerfilUrl: urlDescarga });
                        avatarLetra.innerText = "";
                        avatarLetra.style.backgroundImage = `url('${urlDescarga}')`;
                        msgGuardado.style.color = "#00ff88";
                        msgGuardado.innerText = "¡Foto de perfil ajustada y guardada con éxito!";
                        setTimeout(() => { msgGuardado.innerText = ""; }, 3000);
                    } catch (error) {
                        console.error("Error al subir el recorte:", error);
                        msgGuardado.style.color = "#ff4444";
                        msgGuardado.innerText = "Error al guardar el ajuste en el servidor.";
                    } finally {
                        inputArchivoFoto.value = ""; 
                    }
                }, "image/jpeg", 0.9); 
            });
        }

        const btnGuardarPerfil = document.getElementById('btnGuardarPerfil');
        if (btnGuardarPerfil) {
            btnGuardarPerfil.addEventListener('click', async () => {
                if (!userDocRef) return;
                const nuevoUsername = userUsernameInput.value.trim();

                msgGuardado.style.color = "#ffcc00";
                msgGuardado.innerText = "Guardando cambios...";

                try {
                    await updateDoc(userDocRef, {
                        username: nuevoUsername,
                        bio: userBioInput.value.trim()
                    });

                    userSmallUsername.innerText = (nuevoUsername !== "") ? `(${nuevoUsername})` : "";
                    msgGuardado.style.color = "#00ff88";
                    msgGuardado.innerText = "¡Cambios guardados correctamente!";
                    setTimeout(() => { msgGuardado.innerText = ""; }, 3000);
                } catch (error) {
                    console.error("Error al actualizar perfil:", error);
                    msgGuardado.style.color = "#ff4444";
                    msgGuardado.innerText = "Error al intentar guardar los datos.";
                }
            });
        }

        if (btnGuardarSeguridad) {
            btnGuardarSeguridad.addEventListener('click', async () => {
                if (!usuarioActual) return;
                const passActual = passActualInput.value;
                const passNueva = passNuevaInput.value;
                const passConfirmar = passConfirmarInput.value;

                if (!passActual || !passNueva || !passConfirmar) {
                    msgSeguridad.style.color = "#ff4444";
                    msgSeguridad.innerText = "Por favor, completa todos los campos de contraseña.";
                    return;
                }
                if (passNueva !== passConfirmar) {
                    msgSeguridad.style.color = "#ff4444";
                    msgSeguridad.innerText = "La nueva contraseña y su confirmación no coinciden.";
                    return;
                }
                if (passNueva.length < 6) {
                    msgSeguridad.style.color = "#ff4444";
                    msgSeguridad.innerText = "La nueva contraseña debe tener al menos 6 caracteres.";
                    return;
                }

                msgSeguridad.style.color = "#ffcc00";
                msgSeguridad.innerText = "Autenticando credenciales actuales...";

                try {
                    const credencial = EmailAuthProvider.credential(usuarioActual.email, passActual);
                    await reauthenticateWithCredential(usuarioActual, credencial);
                    msgSeguridad.innerText = "Actualizando contraseña en el sistema...";
                    await updatePassword(usuarioActual, passNueva);

                    msgSeguridad.style.color = "#00ff88";
                    msgSeguridad.innerText = "¡Contraseña actualizada con éxito!";
                    passActualInput.value = "";
                    passNuevaInput.value = "";
                    passConfirmarInput.value = "";
                    setTimeout(() => { msgSeguridad.innerText = ""; }, 4000);
                } catch (error) {
                    console.error("Error en el cambio de contraseña:", error);
                    msgSeguridad.style.color = "#ff4444";
                    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        msgSeguridad.innerText = "La contraseña actual es incorrecta.";
                    } else if (error.code === 'auth/requires-recent-login') {
                        msgSeguridad.innerText = "Por seguridad, vuelve a iniciar sesión e intenta nuevamente.";
                    } else {
                        msgSeguridad.innerText = "Error crítico del sistema al cambiar la contraseña.";
                    }
                }
            });
        }

        // Cambio de pestañas (Tabs)
        const tabCuenta = document.getElementById('tab-cuenta');
        const tabSeguridad = document.getElementById('tab-seguridad');
        const seccionPerfil = document.getElementById('seccion-perfil');
        const seccionSeguridad = document.getElementById('seccion-seguridad');

        if (tabCuenta && tabSeguridad) {
            tabCuenta.addEventListener('click', () => {
                tabCuenta.classList.add('activo');
                tabSeguridad.classList.remove('activo');
                const cursorC = tabCuenta.querySelector('.cursorparpadea');
                const cursorS = tabSeguridad.querySelector('.cursorparpadea');
                if (cursorC) cursorC.style.display = 'inline-block';
                if (cursorS) cursorS.style.display = 'none';
                seccionPerfil.style.display = 'block';
                seccionPerfil.classList.add('activo');
                seccionSeguridad.style.display = 'none';
                seccionSeguridad.classList.remove('activo');
            });

            tabSeguridad.addEventListener('click', () => {
                tabSeguridad.classList.add('activo');
                tabCuenta.classList.remove('activo');
                const cursorC = tabCuenta.querySelector('.cursorparpadea');
                const cursorS = tabSeguridad.querySelector('.cursorparpadea');
                if (cursorS) cursorS.style.display = 'inline-block';
                if (cursorC) cursorC.style.display = 'none';
                seccionSeguridad.style.display = 'block';
                seccionSeguridad.classList.add('activo');
                seccionPerfil.style.display = 'none';
                seccionPerfil.classList.remove('activo');
            });
        }
    }

    // LÓGICA VISTA INDEX.HTML
    if (document.getElementById("pagina-protegida")) {
        const msg = document.getElementById("msg");
        const guardLoadingScreen = document.getElementById("guard-loading-screen");
        const irARegistro = document.getElementById("ir-a-registro");
        const irALogin = document.getElementById("ir-a-login");
        const btnRegister = document.getElementById("btnRegister");
        const btnLogin = document.getElementById("btnLogin");
        const btnCerrarSesion = document.getElementById("btnCerrarSesion");

        const ocultarLoader = () => {
            if (guardLoadingScreen) {
                guardLoadingScreen.style.opacity = "0";
                guardLoadingScreen.style.visibility = "hidden";
                guardLoadingScreen.style.pointerEvents = "none";
                setTimeout(() => { guardLoadingScreen.style.display = "none"; }, 400);
            }
        };

        const mostrarLoader = () => {
            if (guardLoadingScreen) {
                guardLoadingScreen.style.display = "flex";
                guardLoadingScreen.style.opacity = "1";
                guardLoadingScreen.style.visibility = "visible";
                guardLoadingScreen.style.pointerEvents = "all";
            }
        };

        if (irARegistro) {
            irARegistro.onclick = (e) => {
                e.preventDefault();
                document.getElementById("form-login").style.display = "none";
                document.querySelector("#pantalla-login #form-registro").style.display = "flex";
                document.getElementById("titulo-form").innerText = "CREAR CUENTA";
                if (msg) msg.innerText = "";
            };
        }

        if (irALogin) {
            irALogin.onclick = (e) => {
                e.preventDefault();
                document.querySelector("#pantalla-login #form-registro").style.display = "none";
                document.getElementById("form-login").style.display = "flex";
                document.getElementById("titulo-form").innerText = "INICIAR SESIÓN";
                if (msg) msg.innerText = "";
            };
        }

        if (btnRegister) {
            btnRegister.onclick = () => {
                const contenedor = document.getElementById("pantalla-login");
                const rut = contenedor.querySelector("#regRut").value.trim();
                const email = contenedor.querySelector("#regEmailSip").value.toLowerCase().trim();
                const pass = contenedor.querySelector("#regPassSip").value;
                const confirm = contenedor.querySelector("#regConfirmPassSip").value;

                if (!validarRut(rut)) {
                    if (msg) msg.innerText = "Error: El RUT es inválido.";
                    return;
                }
                if (!email.endsWith("@alumnos.sip.cl") && !email.endsWith("@sip.cl")) {
                    if (msg) msg.innerText = "Usa correo @alumnos.sip.cl o @sip.cl";
                    return;
                }
                if (pass !== confirm) {
                    if (msg) msg.innerText = "Las contraseñas no coinciden.";
                    return;
                }
                if (pass.length < 6) {
                    if (msg) msg.innerText = "La contraseña debe de tener un mínimo 6 caracteres.";
                    return;
                }

                mostrarLoader();

                createUserWithEmailAndPassword(auth, email, pass)
                    .then(async (userCredential) => {
                        const user = userCredential.user;
                        const nombreAsignado = extraerNombreDesdeCorreo(email);
                        await setDoc(doc(db, "usuarios", user.uid), {
                            nombreReal: nombreAsignado,
                            correo: email,
                            rut: rut,
                            username: "",
                            bio: "",
                            creadoEn: new Date(),
                        });
                        alert(`¡Cuenta creada con éxito! Bienvenido/a ${nombreAsignado}. Ahora inicia sesión manualmente.`);
                        await signOut(auth);
                        location.reload();
                    })
                    .catch((err) => {
                        ocultarLoader();
                        if (msg) {
                            msg.innerText = (err.code === "auth/email-already-in-use") 
                                ? "El correo ya existe." 
                                : "Error: " + err.message;
                        }
                    });
            };
        }

        if (btnLogin) {
            btnLogin.onclick = () => {
                const email = document.getElementById("loginUserSip").value.trim();
                const pass = document.getElementById("loginPassSip").value;
                const recordar = document.getElementById("recordarme") ? document.getElementById("recordarme").checked : false;

                if (!email || !pass) {
                    if (msg) msg.innerText = "Por favor, completa ambos campos.";
                    return;
                }

                mostrarLoader();

                const persistencia = recordar ? browserLocalPersistence : browserSessionPersistence;

                setPersistence(auth, persistencia)
                    .then(() => signInWithEmailAndPassword(auth, email, pass))
                    .catch((err) => {
                        ocultarLoader();
                        if (msg) msg.innerText = "Correo o contraseña incorrectos.";
                    });
            };
        }

        if (btnCerrarSesion) {
            btnCerrarSesion.onclick = () => {
                mostrarLoader();
                signOut(auth).then(() => location.reload()).catch(() => ocultarLoader());
            };
        }

        onAuthStateChanged(auth, (user) => {
            const loginScreen = document.getElementById("pantalla-login");
            const mainContent = document.getElementById("pagina-protegida");

            if (user) {
                if (loginScreen) loginScreen.style.display = "none";
                if (mainContent) mainContent.style.display = "block";
                if (typeof cargarLeaderboard === "function") cargarLeaderboard();
            } else {
                if (loginScreen) loginScreen.style.display = "flex";
                if (mainContent) mainContent.style.display = "none";

                const inputUser = document.getElementById("loginUserSip");
                const inputPass = document.getElementById("loginPassSip");
                if (inputUser) inputUser.value = "";
                if (inputPass) inputPass.value = "";

                const formLogin = document.getElementById("form-login");
                if (formLogin) formLogin.style.display = "flex";
                const formReg = document.querySelector("#pantalla-login #form-registro");
                if (formReg) formReg.style.display = "none";
                const tituloForm = document.getElementById("titulo-form");
                if (tituloForm) tituloForm.innerText = "INICIAR SESIÓN";
            }

            ocultarLoader();
        });

        // Modales y vistas secundarias
        const reportScreen = document.getElementById("report-screen");
        const misReportesScreen = document.getElementById("mis-reportes-screen");
        const soporteScreen = document.getElementById("soporte-screen");

        const abrirReporte = document.getElementById("abrirReporte");
        if (abrirReporte) {
            abrirReporte.addEventListener("click", (e) => {
                e.preventDefault();
                if (reportScreen) reportScreen.classList.add("is-open");
            });
        }

        const cerrarReporte = document.getElementById("cerrarReporte");
        if (cerrarReporte) {
            cerrarReporte.addEventListener("click", (e) => {
                e.preventDefault();
                if (reportScreen) reportScreen.classList.remove("is-open");
            });
        }

        const abrirMisReportes = document.getElementById("abrirMisReportes");
        if (abrirMisReportes) {
            abrirMisReportes.addEventListener("click", (e) => {
                e.preventDefault();
                closeMenuIfExists();
                if (misReportesScreen) misReportesScreen.classList.add("is-open");
                cargarMisReportes();
            });
        }

        const cerrarMisReportes = document.getElementById("cerrarMisReportes");
        if (cerrarMisReportes) {
            cerrarMisReportes.addEventListener("click", (e) => {
                e.preventDefault();
                if (misReportesScreen) misReportesScreen.classList.remove("is-open");
            });
        }

        const abrirSoporte = document.getElementById("abrirSoporte");
        if (abrirSoporte) {
            abrirSoporte.addEventListener("click", (e) => {
                e.preventDefault();
                closeMenuIfExists();
                if (soporteScreen) soporteScreen.classList.add("is-open");
            });
        }

        const cerrarSoporte = document.getElementById("cerrarSoporte");
        if (cerrarSoporte) {
            cerrarSoporte.addEventListener("click", (e) => {
                e.preventDefault();
                if (soporteScreen) soporteScreen.classList.remove("is-open");
            });
        }

        const btnEnviarReporte = document.getElementById("btnEnviarReporte");
        if (btnEnviarReporte) {
            btnEnviarReporte.addEventListener("click", async () => {
                const user = auth.currentUser;
                const reporteMsg = document.getElementById("reporteMsg");

                const setReporteMsg = (texto, tipo) => {
                    if (!reporteMsg) return;
                    reporteMsg.innerText = texto;
                    reporteMsg.className = tipo || "";
                };

                if (!user) {
                    setReporteMsg("Debes iniciar sesión.", "err");
                    return;
                }

                const titulo = document.getElementById("reporteTitulo").value.trim();
                const descripcion = document.getElementById("reporteDescripcion").value.trim();
                const archivoInput = document.getElementById("reporteArchivo");
                const archivo = archivoInput ? archivoInput.files[0] : null;
                const anonimo = document.getElementById("reporteAnonimo") ? document.getElementById("reporteAnonimo").checked : false;

                if (!titulo || !descripcion) {
                    setReporteMsg("Completa el título y la descripción.", "err");
                    return;
                }

                btnEnviarReporte.disabled = true;
                setReporteMsg("Enviando reporte...", "");

                try {
                    const perfilSnap = await getDoc(doc(db, "usuarios", user.uid));
                    const nombreReal = perfilSnap.exists() ? perfilSnap.data().nombreReal || user.email : user.email;
                    const fotoPerfilUrl = perfilSnap.exists() ? perfilSnap.data().fotoPerfilUrl || null : null;
                    const usernameElegido = perfilSnap.exists() ? perfilSnap.data().username || null : null;

                    let archivoURL = null;
                    let archivoNombre = null;
                    if (archivo) {
                        archivoNombre = archivo.name;
                        const rutaArchivo = ref(storage, `reportes/${user.uid}/${Date.now()}_${archivo.name}`);
                        await uploadBytes(rutaArchivo, archivo);
                        archivoURL = await getDownloadURL(rutaArchivo);
                    }

                    const nuevoReporte = {
                        titulo,
                        descripcion,
                        archivoURL,
                        archivoNombre,
                        autorUID: user.uid,
                        autorNombre: nombreReal,
                        autorUsername: usernameElegido,
                        autorFotoUrl: fotoPerfilUrl,
                        autorCorreo: user.email,
                        anonimo,
                        destacado: false,
                        fecha: serverTimestamp(),
                    };
                    await addDoc(collection(db, "reportes"), nuevoReporte);

                    if (window.emailjs && EMAILJS_PUBLIC_KEY !== "TU_PUBLIC_KEY") {
                        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                            titulo,
                            descripcion,
                            nombre_remitente: nombreReal,
                            correo_remitente: user.email,
                            archivo_url: archivoURL || "Sin archivo adjunto",
                            fecha: new Date().toLocaleString("es-CL"),
                        });
                    }

                    setReporteMsg("¡Reporte enviado con éxito!", "ok");
                    const formReporte = document.getElementById("form-reporte");
                    if (formReporte) formReporte.reset();
                    if (typeof cargarLeaderboard === "function") cargarLeaderboard();

                    setTimeout(() => {
                        if (reportScreen) reportScreen.classList.remove("is-open");
                        setReporteMsg("", "");
                    }, 1200);
                } catch (err) {
                    console.error(err);
                    setReporteMsg("Error al enviar el reporte: " + err.message, "err");
                } finally {
                    btnEnviarReporte.disabled = false;
                }
            });
        }

        async function cargarLeaderboard() {
            const tbody = document.getElementById("leaderboardBody");
            if (!tbody) return;
            try {
                const q = query(collection(db, "reportes"), orderBy("fecha", "desc"), limit(10));
                const snap = await getDocs(q);

                if (snap.empty) {
                    tbody.innerHTML = '<tr><td colspan="3" class="tablavacia">Aún no hay reportes publicados.</td></tr>';
                    return;
                }

                tbody.innerHTML = "";
                snap.forEach((docSnap) => {
                    const r = docSnap.data();
                    const nombreMostrado = r.anonimo
                        ? '<span class="medallaanonimo">Anónimo</span>'
                        : escapeHTML(r.autorNombre || "Usuario") + (r.autorUsername ? ` <span class="nombreautor">(${escapeHTML(r.autorUsername)})</span>` : "");
                    const avatarHTML = (!r.anonimo && r.autorFotoUrl)
                        ? `<img class="avatarautor" src="${r.autorFotoUrl}" alt="">`
                        : `<span class="avatarvacioautor"><svg viewBox="0 0 24 24" fill="currentColor" style="color:#fff"><path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.5c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z"/></svg></span>`;
                    const destacadoBadge = r.destacado ? '<span class="medalladestacado">★ Destacado</span>' : "";
                    const fechaTexto = (r.fecha && r.fecha.toDate) ? r.fecha.toDate().toLocaleDateString("es-CL") : "—";

                    const fila = document.createElement("tr");
                    fila.innerHTML = `
                        <td>${escapeHTML(r.titulo)} ${destacadoBadge}</td>
                        <td><span class="celdaautor">${avatarHTML}${nombreMostrado}</span></td>
                        <td>${fechaTexto}</td>
                    `;
                    tbody.appendChild(fila);
                });
            } catch (err) {
                console.error(err);
                tbody.innerHTML = '<tr><td colspan="3" class="tablavacia">No se pudo cargar la tabla de clasificación.</td></tr>';
            }
        }

        async function cargarMisReportes() {
            const contenedor = document.getElementById("misReportesLista");
            const user = auth.currentUser;
            if (!user || !contenedor) return;

            contenedor.innerHTML = '<p class="tablavacia">Cargando tus reportes...</p>';
            try {
                // Se quita 'orderBy' de la consulta para evitar error de índice compuesto en Firestore
                const q = query(collection(db, "reportes"), where("autorUID", "==", user.uid));
                const snap = await getDocs(q);

                if (snap.empty) {
                    contenedor.innerHTML = '<p class="tablavacia">Todavía no has enviado ningún reporte.</p>';
                    return;
                }

                // Se convierten y ordenan por fecha en JavaScript local
                const listaReportes = [];
                snap.forEach((docSnap) => {
                    listaReportes.push(docSnap.data());
                });

                listaReportes.sort((a, b) => {
                    const fechaA = (a.fecha && a.fecha.toDate) ? a.fecha.toDate().getTime() : 0;
                    const fechaB = (b.fecha && b.fecha.toDate) ? b.fecha.toDate().getTime() : 0;
                    return fechaB - fechaA;
                });

                contenedor.innerHTML = "";
                listaReportes.forEach((r) => {
                    const fechaTexto = (r.fecha && r.fecha.toDate) ? r.fecha.toDate().toLocaleString("es-CL") : "—";
                    const archivoHTML = r.archivoURL ? `<a class="enlacearchivo" href="${r.archivoURL}" target="_blank" rel="noopener">Ver archivo adjunto</a>` : "";
                    const anonimoTexto = r.anonimo ? '<span class="medallaanonimo">Publicado como anónimo</span>' : "";

                    const card = document.createElement("div");
                    card.className = "tarjetamireporte";
                    card.innerHTML = `
                        <h4>${escapeHTML(r.titulo)}</h4>
                        <p>${escapeHTML(r.descripcion)}</p>
                        <div class="metadatos">${fechaTexto} ${anonimoTexto}</div>
                        ${archivoHTML}
                    `;
                    contenedor.appendChild(card);
                });
            } catch (err) {
                console.error("Error al cargar reportes:", err);
                contenedor.innerHTML = '<p class="tablavacia">No se pudieron cargar tus reportes.</p>';
            }
        }

        // Lógica del menú Hamburguesa
        const btnHamburger = document.getElementById("btnHamburger");
        const navPanel = document.getElementById("navPanel");
        const navOverlay = document.getElementById("navOverlay");

        if (btnHamburger && navPanel && navOverlay) {
            function openMenu() {
                navPanel.classList.add("is-open");
                navOverlay.classList.add("is-open");
                btnHamburger.classList.add("is-open");
                btnHamburger.setAttribute("aria-expanded", "true");
                document.body.style.overflow = "hidden";
            }
            function closeMenu() {
                navPanel.classList.remove("is-open");
                navOverlay.classList.remove("is-open");
                btnHamburger.classList.remove("is-open");
                btnHamburger.setAttribute("aria-expanded", "false");
                document.body.style.overflow = "";
            }

            btnHamburger.addEventListener("click", () => navPanel.classList.contains("is-open") ? closeMenu() : openMenu());
            navOverlay.addEventListener("click", closeMenu);
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape") closeMenu();
            });
        }
    }
});