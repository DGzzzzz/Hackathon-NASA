import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Variáveis principais
let scene, camera, renderer, raycaster, planets = [];
let planetInfo, generateButton;
let exoplanetsData = [];

// Carregar texturas
const loader = new THREE.TextureLoader();
const universeTexture = loader.load('/assets/images/universe.jpeg');
const planetTexture = loader.load('/assets/images/planet.jpg');

const jsonFilePath = '/assets/data.json';

// Buscar dados da API e inicializar a cena
fetch(jsonFilePath)
  .then(response => response.json())
  .then(data => {
    exoplanetsData = data;
    init();
    generateRandomPlanets();
    animate();
  })
  .catch(error => {
    console.error('Erro ao buscar os dados:', error);
  });

function init() {
  planetInfo = document.getElementById('info');
  generateButton = document.getElementById('generatePlanets');

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 50);

  // Fundo do Universo
  const universeMaterial = new THREE.MeshBasicMaterial({ map: universeTexture, side: THREE.BackSide });
  const universeGeometry = new THREE.SphereGeometry(900, 32, 32);
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

  // Detectar clique nos planetas
  window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);
    if (intersects.length > 0) {
      const selectedPlanet = intersects[0].object;
      showPlanetInfo(selectedPlanet);
    }
  });

  // Redimensionar a tela
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Verificar se o botão está sendo clicado
  generateButton.addEventListener('click', () => {
    console.log('Gerando novos exoplanetas...');
    generateRandomPlanets();
  });
}

// Função para gerar 5 novos exoplanetas aleatórios
function generateRandomPlanets() {
  // Remover planetas antigos corretamente
  planets.forEach(planet => {
    scene.remove(planet);
    planet.geometry.dispose();  // Liberar a geometria
    planet.material.dispose();  // Liberar o material
  });
  planets = [];

  // Distância horizontal entre os planetas
  const baseDistance = 15;

  // Gerar 5 novos planetas com informações da API
  for (let i = 0; i < 5; i++) {
    // Selecionar um exoplaneta aleatório
    const randomExoplanet = exoplanetsData[Math.floor(Math.random() * exoplanetsData.length)];

    // Calcular o tamanho do planeta com base no raio (koi_prad)
    const planetRadius = randomExoplanet.koi_prad || 1; // Usar o valor da API, com fallback para 1

    // Criar geometria e material do planeta
    const planetGeometry = new THREE.SphereGeometry(planetRadius, 24, 24);
    const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);

    // Adicionar cursor de pointer
    planet.userData = { name: randomExoplanet.kepoi_name };
    planet.cursor = 'pointer';  // Define o cursor como pointer
    planet.userData = {
      name: randomExoplanet.kepoi_name,
      period: randomExoplanet.koi_period,
      radius: randomExoplanet.koi_prad,
      temperature: randomExoplanet.koi_teq,
      magnitude: randomExoplanet.koi_kepmag,
      insol: randomExoplanet.koi_insol,
      ra: randomExoplanet.ra_str,
      dec: randomExoplanet.dec_str,
      koiName: randomExoplanet.koi_name
    };

    // Posicionar planetas lado a lado
    planet.position.set(baseDistance * i - 30, 0, 0);

    scene.add(planet);
    planets.push(planet);
  }

  planetInfo.innerHTML = 'Clique em um exoplaneta para ver as informações';
}

// Exibir todas as informações do exoplaneta no card
function showPlanetInfo(planet) {
  planetInfo.innerHTML = `
    <strong>${planet.userData.name}</strong><br>
    Período Orbital: ${planet.userData.period} dias<br>
    Raio: ${planet.userData.radius} raios terrestres<br>
    Temperatura: ${planet.userData.temperature} K<br>
    Magnitude: ${planet.userData.magnitude}<br>
    Insolação: ${planet.userData.insol}<br>
    RA: ${planet.userData.ra}<br>
    Dec: ${planet.userData.dec}<br>
    Nome KOI: ${planet.userData.koiName}
  `;
}

// Loop de animação
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
