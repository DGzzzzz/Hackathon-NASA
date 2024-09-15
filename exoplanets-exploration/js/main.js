import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Variáveis principais
let scene, camera, renderer, raycaster, stars = [];
let initialCameraPosition = new THREE.Vector3(0, 0, 50);
const planetInfo = document.getElementById('info');
let isFocusedOnStar = false;  // Variável de controle para foco na estrela
let isRotationEnabled = false;  // Variável de controle para rotação da cena
let exoplanetsData = [];

// Carregar texturas
const loader = new THREE.TextureLoader();
const starTexture = loader.load('/assets/images/star.jpg');  // Textura da estrela
const glowTexture = loader.load('/assets/images/glow.png');  // Textura de brilho
const universeTexture = loader.load('/assets/images/universe.jpg');
const planetTexture = loader.load('/assets/images/planet.jpg');

const jsonFilePath = '/assets/data.json';

// Buscar dados da API e inicializar a cena
fetch(jsonFilePath)
  .then(response => response.json())
  .then(data =>
  {
    exoplanetsData = data;
    console.log(exoplanetsData);
    init(); // Inicializar a cena após buscar os dados
    animate(); // Iniciar loop de animação
  })
  .catch(error =>
  {
    console.error('Erro ao buscar os dados:', error);
  });

function init()
{
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.copy(initialCameraPosition);

  // Fundo do Universo
  const universeMaterial = new THREE.MeshBasicMaterial({ map: universeTexture, side: THREE.BackSide });
  const universeGeometry = new THREE.SphereGeometry(1000, 32, 32);
  const universe = new THREE.Mesh(universeGeometry, universeMaterial);
  scene.add(universe);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Controles de órbita
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.enabled = false;  // Desativado até que uma estrela seja selecionada

  // Criar estrelas
  for (let i = 0; i < exoplanetsData.length / 10; i++) // reduzido quantidade de estrelas
  {
    const starGeometry = new THREE.SphereGeometry(0.5, 24, 24);
    const starMaterial = new THREE.MeshStandardMaterial({
      map: starTexture,
      emissive: 0xffffff,
      emissiveIntensity: 1,
      transparent: true,
    });

    const star = new THREE.Mesh(starGeometry, starMaterial);

    // Posicionar aleatoriamente
    star.position.set(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 200
    );

    // Associar dados da estrela
    const exoplanet = exoplanetsData[i];
    star.userData = {
      kepler_name: exoplanet.kepler_name,
      koi_period: exoplanet.koi_period,
      koi_prad: exoplanet.koi_prad,
      koi_teq: exoplanet.koi_teq,
      koi_kepmag: exoplanet.koi_kepmag,
      koi_insol: exoplanet.koi_insol,
      koi_name: exoplanet.koi_name,
      ra_str: exoplanet.ra_str,
      dec_str: exoplanet.dec_str,
      planets: []  // Espaço reservado para planetas
    };

    scene.add(star);
    stars.push(star);

    // Adicionar efeito de brilho à estrela
    const spriteMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.5
    });
    const glow = new THREE.Sprite(spriteMaterial);
    glow.scale.set(3, 3, 1);
    glow.position.copy(star.position);
    scene.add(glow);
  }

  // Efeito de movimento do fundo com o mouse
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

  // Redimensionar a tela
  window.addEventListener('resize', () =>
  {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Sair do zoom ao apertar "Esc"
  window.addEventListener('keydown', (e) =>
  {
    if (e.key === 'Escape')
    {
      exitZoom(controls);
    }
  });

  // Alternar rotação da cena
  const toggleRotationButton = document.getElementById('toggleRotation');
  toggleRotationButton.addEventListener('click', () =>
  {
    isRotationEnabled = !isRotationEnabled;
    toggleRotationButton.textContent = isRotationEnabled ? 'Desativar Rotação' : 'Ativar Rotação';
  });
}

// Função para sair do zoom na estrela
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
      controls.enabled = false;
      isFocusedOnStar = false;
    }
  }
  animateExit();
}

// Função para mover a câmera até a estrela selecionada
function moveToStar(star, controls)
{
  const targetPosition = new THREE.Vector3().copy(star.position);
  const safeDistance = 5;  // Distância segura
  let progress = 0;
  const initialPosition = camera.position.clone();
  const direction = new THREE.Vector3().subVectors(camera.position, targetPosition).normalize();
  const finalPosition = targetPosition.clone().add(direction.multiplyScalar(safeDistance));

  function animateCamera()
  {
    progress += 0.02;
    camera.position.lerpVectors(initialPosition, finalPosition, progress);
    camera.lookAt(star.position);
    if (progress < 1)
    {
      requestAnimationFrame(animateCamera);
    } else
    {
      controls.enabled = true;
      controls.target.copy(star.position);
      isFocusedOnStar = true;
      displayPlanets(star);
    }
  }
  animateCamera();
}

// Exibir planetas orbitando a estrela selecionada
function displayPlanets(star)
{
  planetInfo.innerHTML = `Estrela: ${star.userData.kepler_name}. Clique nos planetas para mais informações.`;
  star.userData.planets.forEach(planet => scene.remove(planet));
  star.userData.planets = [];

  for (let i = 0; i < 5; i++)
  {
    const planetGeometry = new THREE.SphereGeometry(0.5, 24, 24);
    const planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);

    const distance = 5 + Math.random() * 5;  // Distância da órbita
    planet.position.set(
      star.position.x + distance * Math.cos(i),
      star.position.y + distance * Math.sin(i),
      star.position.z + Math.random() * 5 - 2
    );

    const exoplanet = exoplanetsData[i % exoplanetsData.length];
    planet.userData = {
      name: exoplanet.kepoi_name,
      info: `Período: ${exoplanet.koi_period}, Raio: ${exoplanet.koi_prad}`
    };

    scene.add(planet);
    star.userData.planets.push(planet);
  }
}

// Clique nos planetas para exibir informações
window.addEventListener('click', (event) =>
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
});

// Exibir informações do planeta
function showPlanetInfo(planet)
{
  planetInfo.innerHTML = `${planet.userData.name}: ${planet.userData.info}`;
}

// Rotacionar cena se rotação estiver ativada
function rotateScene()
{
  scene.rotation.y += 0.001;
}

// Loop de animação
function animate()
{
  requestAnimationFrame(animate);
  if (isRotationEnabled && !isFocusedOnStar)
  {
    rotateScene();
  }
  renderer.render(scene, camera);
}