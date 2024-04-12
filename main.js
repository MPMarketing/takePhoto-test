const cam = document.querySelector('#video');
const loadingMsg = document.querySelector('#loading');
const successMsg = document.querySelector('#success-msg');
const takePhotoBtn = document.querySelector('#take-photo-btn');
const messageTop = document.querySelector('#message-top');
let canvas;
let canvasContext;
let faceDrawInterval;
let displaySize;
let currentStep = 0;
let photosTaken = 0;

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

async function startVideo() {
    const constraints = { video: true };

    try {
        let stream = await navigator.mediaDevices.getUserMedia(constraints);

        cam.srcObject = stream;
        cam.onloadedmetadata = e => {
            cam.play();
            showMessage();
        }

    } catch (err) {
        console.error(err);
    }
}

function showMessage() {
    switch (currentStep) {
        case 0:
            messageTop.innerText = 'Fique com o rosto reto';
            break;
        case 1:
            messageTop.innerText = 'Vire seu rosto levemente para algum dos lados';
            break;
        case 2:
            messageTop.innerText = 'Agora faça o mesmo no sentido contrário';
            break;
        default:
            messageTop.innerText = '';
    }
}

cam.addEventListener('play', () => {
    canvas = faceapi.createCanvasFromMedia(cam);
    document.body.append(canvas);
    canvasContext = canvas.getContext("2d");

    displaySize = { width: cam.width, height: cam.height };

    faceapi.matchDimensions(canvas, displaySize);

    faceDrawInterval = setInterval(async () => {
        const detections = await faceapi.detectAllFaces(
            cam,
            new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    }, 100);
});

function startNewCapture() {
    cam.play();
    successMsg.style.display = 'none';
    currentStep++;
    showMessage();
}

async function takePhoto() {
    loadingMsg.style.display = 'block';

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cam.videoWidth;
    tempCanvas.height = cam.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(cam, 0, 0, tempCanvas.width, tempCanvas.height);

    const dataURL = tempCanvas.toDataURL();
    const photo = new Image();
    photo.src = dataURL;

    successMsg.style.display = 'none';

    await new Promise(resolve => setTimeout(resolve, 1000));

    loadingMsg.style.display = 'none';
    successMsg.style.display = 'block';

    photosTaken++;

    if (photosTaken < 3) {
        setTimeout(startNewCapture, 2000);
    } else {
        setTimeout(() => {
            // Redirecionar para outra página após a terceira foto
            window.open('https://www.google.com', '_blank');
        }, 1000); // Aguarda 1 segundo após a terceira foto antes de redirecionar
    }
}

takePhotoBtn.addEventListener('click', takePhoto);
