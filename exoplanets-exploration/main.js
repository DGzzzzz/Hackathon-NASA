import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Variáveis principais
let scene, camera, renderer, raycaster, stars = [];
let initialCameraPosition = new THREE.Vector3(0, 0, 50);
const planetInfo = document.getElementById('info');
let isFocusedOnStar = false;  // Variável de controle
let isRotationEnabled = false;  // Variável de controle para rotação

// Carregar texturas
const loader = new THREE.TextureLoader();
const starTexture = loader.load('/assets/images/star.jpg');  // Textura da estrela
const glowTexture = loader.load('/assets/images/glow.png');  // Textura de glow
const universeTexture = loader.load('/assets/images/universe.jpg');
const planetTexture = loader.load('/assets/images/planet.jpg');


// Inicializar a cena
init();
animate();

function init()
{
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.copy(initialCameraPosition);

  // Adicionar plano de fundo do universo
  const universeMaterial = new THREE.MeshBasicMaterial({ map: universeTexture, side: THREE.BackSide });
  const universeGeometry = new THREE.SphereGeometry(500, 32, 32);
  const universe = new THREE.Mesh(universeGeometry, universeMaterial);
  scene.add(universe);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Inicializar os controles de órbita
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;  // Desabilitar o movimento de pan
  controls.enabled = false;  // Desativar até que uma estrela seja selecionada

  // Criar várias estrelas com textura e brilho
  for (let i = 0; i < 100; i++)
  {
    const starGeometry = new THREE.SphereGeometry(0.5, 24, 24);
    const starMaterial = new THREE.MeshStandardMaterial({
      map: starTexture,
      emissive: 0xffffff,
      emissiveIntensity: 1,
      transparent: true,
    });

    const star = new THREE.Mesh(starGeometry, starMaterial);

    star.position.set(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 200
    );

    scene.add(star);
    stars.push(star);

    // Adicionar um sprite de glow na estrela
    const spriteMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.5
    });
    const glow = new THREE.Sprite(spriteMaterial);
    glow.scale.set(3, 3, 1);  // Ajusta o tamanho do brilho

    glow.position.copy(star.position);  // Posiciona o glow junto da estrela
    scene.add(glow);
  }

  // Movimento do fundo conforme o mouse mexe
  document.addEventListener('mousemove', (event) =>
  {
    if (!isFocusedOnStar)
    {
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

      universe.rotation.y = mouseX * 0.05;
      universe.rotation.x = mouseY * 0.05;
    }
  });

  // Detectar clique nas estrelas
  window.addEventListener('click', (event) =>
  {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(stars);
    if (intersects.length > 0)
    {
      const selectedStar = intersects[0].object;
      moveToStar(selectedStar, controls);
    }
  });

  window.addEventListener('resize', () =>
  {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  window.addEventListener('keydown', (e) =>
  {
    if (e.key === 'Escape')
    {
      exitZoom(controls);
    }
  });

  // Adicionar event listener ao botão de rotação
  const toggleRotationButton = document.getElementById('toggleRotation');
  toggleRotationButton.addEventListener('click', () =>
  {
    isRotationEnabled = !isRotationEnabled;
    toggleRotationButton.textContent = isRotationEnabled ? 'Desativar Rotação' : 'Ativar Rotação';
  });
}

function exitZoom(controls)
{
  const currentCameraPosition = camera.position.clone();
  let progress = 0;

  function animateExit()
  {
    progress += 0.02;

    camera.position.lerpVectors(currentCameraPosition, initialCameraPosition, progress);

    camera.lookAt(new THREE.Vector3(0, 0, 0));

    if (progress < 1)
    {
      requestAnimationFrame(animateExit);
    } else
    {
      controls.enabled = false;  // Desativar os controles de órbita
      isFocusedOnStar = false;  // Atualizar a variável de controle
    }
  }

  animateExit();
}

// Função de animação para mover a câmera em direção à estrela
function moveToStar(star, controls)
{
  const targetPosition = new THREE.Vector3().copy(star.position);
  const safeDistance = 5;  // Distância segura da estrela
  let progress = 0;

  const initialPosition = camera.position.clone();

  // Calcular a direção entre a câmera e a estrela e definir um ponto seguro para parar
  const direction = new THREE.Vector3().subVectors(camera.position, targetPosition).normalize();
  const finalPosition = targetPosition.clone().add(direction.multiplyScalar(safeDistance));

  function animateCamera()
  {
    progress += 0.02;

    // Mover a câmera para a posição final, sem entrar na estrela
    camera.position.lerpVectors(initialPosition, finalPosition, progress);

    camera.lookAt(star.position);

    if (progress < 1)
    {
      requestAnimationFrame(animateCamera);
    } else
    {
      controls.enabled = true;  // Habilitar os controles de órbita
      controls.target.copy(star.position);
      isFocusedOnStar = true;  // Atualizar a variável de controle
      displayPlanets(star);  // Mostrar os planetas após o movimento da câmera
    }
  }

  animateCamera();
}

// Criar planetas orbitando a estrela
function displayPlanets(star)
{
  planetInfo.innerHTML = "Planetas ao redor da estrela! Clique em um planeta!";

  // Limpar planetas anteriores
  star.userData.planets?.forEach(planet => scene.remove(planet));
  star.userData.planets = [];

  // Criar planetas com textura
  for (let i = 0; i < 5; i++)
  {
    const planetGeometry = new THREE.SphereGeometry(0.5, 24, 24);
    const planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);

    // Colocar o planeta em uma órbita ao redor da estrela
    const distance = 5 + Math.random() * 5;  // Orbitando a uma distância maior
    planet.position.set(
      star.position.x + distance * Math.cos(i),
      star.position.y + distance * Math.sin(i),
      star.position.z + Math.random() * 5 - 2
    );

    planet.userData = { name: `Planeta ${i + 1}`, info: `Este é o planeta ${i + 1}.` };

    scene.add(planet);
    star.userData.planets.push(planet);
  }

  // Adicionar evento de clique para planetas
  window.addEventListener('click', onPlanetClick);
}

// Função para lidar com clique nos planetas
function onPlanetClick(event)
{
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(stars.flatMap(star => star.userData.planets || []));
  if (intersects.length > 0)
  {
    const selectedPlanet = intersects[0].object;
    showPlanetInfo(selectedPlanet);
  }
}

// Exibir informações do planeta
function showPlanetInfo(planet)
{
  planetInfo.innerHTML = `${planet.userData.name}: ${planet.userData.info}`;
}

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// Função para rotacionar a cena
function rotateScene()
{
  scene.rotation.y += 0.001;  // Ajuste a velocidade de rotação conforme necessário
}

function animate()
{
  requestAnimationFrame(animate);
  if (isRotationEnabled && !isFocusedOnStar)
  {
    rotateScene();
  }
  renderer.render(scene, camera);
}