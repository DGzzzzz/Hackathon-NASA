import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Variáveis principais
let scene,
  camera,
  renderer,
  raycaster,
  currentStarSystem = null;
let planetInfo, generateButton, toggleRotationButton;
let exoplanetsData = [];
let isRotationEnabled = false;

// Carregar texturas
const loader = new THREE.TextureLoader();
const universeTexture = loader.load(
  "https://repo-estaticos.vercel.app/universe.jpeg"
);
const planetTexture = {
  generic: loader.load("https://repo-estaticos.vercel.app/planet.jpg"),
  hot: loader.load("https://repo-estaticos.vercel.app/hot.jpg"),
  cold: loader.load("https://repo-estaticos.vercel.app/cold.jpg"),
};

const jsonFilePath = "https://repo-estaticos.vercel.app/data.json";

// Buscar dados da API e inicializar a cena
fetch(jsonFilePath)
  .then((response) => response.json())
  .then((data) => {
    exoplanetsData = data;
    init();
    generateRandomStarSystem();
    animate();
  })
  .catch((error) => {
    console.error("Erro ao buscar os dados:", error);
  });

function init() {
  planetInfo = document.getElementById("info");
  generateButton = document.getElementById("generatePlanets");
  toggleRotationButton = document.getElementById("toggleRotation");

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 50);

  // Fundo do Universo
  const universeMaterial = new THREE.MeshBasicMaterial({
    map: universeTexture,
    side: THREE.BackSide,
  });
  const universeGeometry = new THREE.SphereGeometry(900, 32, 32);
  const universe = new THREE.Mesh(universeGeometry, universeMaterial);
  scene.add(universe);

  // luz ambiente
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);

  // Luz direcional
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5).normalize();
  scene.add(directionalLight);

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
  window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      currentStarSystem ? currentStarSystem.planets : []
    );
    if (intersects.length > 0) {
      const selectedPlanet = intersects[0].object;
      showPlanetInfo(selectedPlanet);
    }
  });

  // Redimensionar a tela
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Verificar se o botão está sendo clicado
  generateButton.addEventListener("click", () => {
    console.log("Gerando novo sistema estelar...");
    generateRandomStarSystem();
  });

  // Verificar se o botão de rotação está sendo clicado
  toggleRotationButton.addEventListener("click", () => {
    isRotationEnabled = !isRotationEnabled;
    toggleRotationButton.textContent = isRotationEnabled
      ? "Desativar Rotação"
      : "Ativar Rotação";
  });
}

// ajustar textura com base na temperatura
function getTextureForPlanet(temperature) {
  if (temperature > 500) {
    return planetTexture.hot;
  } else if (temperature < 0) {
    return planetTexture.cold;
  } else {
    return planetTexture.generic;
  }
}

// Agrupar exoplanetas por estrela
function groupExoplanetsByStar() {
  const stars = {};
  exoplanetsData.forEach((exoplanet) => {
    const starId = exoplanet.kepid;
    if (!stars[starId]) {
      stars[starId] = {
        starId: starId,
        planets: [],
      };
    }
    stars[starId].planets.push(exoplanet);
  });
  return Object.values(stars);
}

// Função para gerar um sistema estelar aleatório
function generateRandomStarSystem() {
  // Remover sistema estelar antigo corretamente
  if (currentStarSystem) {
    currentStarSystem.planets.forEach((planet) => {
      scene.remove(planet);
      planet.geometry.dispose(); // Liberar a geometria
      planet.material.dispose(); // Liberar o material
    });
    scene.remove(currentStarSystem.starMesh);
    currentStarSystem.starMesh.geometry.dispose();
    currentStarSystem.starMesh.material.dispose();
  }

  // Agrupar exoplanetas por estrela
  const starSystems = groupExoplanetsByStar();

  // Selecionar um sistema estelar aleatório
  const randomStarSystem =
    starSystems[Math.floor(Math.random() * starSystems.length)];

  // Criar geometria e material da estrela
  const starGeometry = new THREE.SphereGeometry(2, 24, 24);
  const starMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  const starMesh = new THREE.Mesh(starGeometry, starMaterial);

  // Posicionar a estrela
  starMesh.position.set(0, 0, 0);
  scene.add(starMesh);

  // Adicionar planetas ao redor da estrela
  const planets = randomStarSystem.planets.map((exoplanet, planetIndex) => {
    // Calcular o tamanho do planeta com base no raio (koi_prad)
    const planetRadius = exoplanet.koi_prad || 1; // Usar o valor da API, com fallback para 1

    // Ajustar textura com base na temperatura
    const planetTexture = getTextureForPlanet(exoplanet.koi_teq);

    // Criar geometria e material do planeta
    const planetGeometry = new THREE.SphereGeometry(planetRadius, 24, 24);
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: planetTexture,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);

    // Adicionar cursor de pointer
    planet.userData = {
      name: exoplanet.kepoi_name,
      period: exoplanet.koi_period,
      radius: exoplanet.koi_prad,
      temperature: exoplanet.koi_teq,
      magnitude: exoplanet.koi_kepmag,
      insol: exoplanet.koi_insol,
      ra: exoplanet.ra_str,
      dec: exoplanet.dec_str,
      koiName: exoplanet.koi_name,
      angle: Math.random() * Math.PI * 2, // Ângulo inicial aleatório
      distance: 10 + planetIndex * 5, // Distância da estrela
    };

    // Posicionar planetas ao redor da estrela
    planet.position.set(
      starMesh.position.x +
        Math.cos(planet.userData.angle) * planet.userData.distance,
      starMesh.position.y +
        Math.sin(planet.userData.angle) * planet.userData.distance,
      0
    );

    scene.add(planet);
    return planet;
  });

  currentStarSystem = { starMesh, planets };

  planetInfo.innerHTML = "Clique em um exoplaneta para ver as informações";
}

// Exibir todas as informações do exoplaneta no card
function showPlanetInfo(planet) {
  planetInfo.innerHTML = `
      <table class="demo">
      <thead></thead>
      <tbody>
        <tr>
          <td class="left-align">Nome: </td>
          <td class="api right-align">${planet.userData.name}</td>
        </tr>
        <tr>
          <td class="left-align">Período Orbital: </td>
          <td class="api right-align">${planet.userData.period} dias</td>
        </tr>
        <tr>
          <td class="left-align">Raio: </td>
          <td class="api right-align">${planet.userData.radius}</td>
        </tr>
        <tr>
          <td class="left-align">Temperatura: </td>
          <td class="api right-align">${planet.userData.temperature}</td>
        </tr>
        <tr>
          <td class="left-align">Magnitude: </td>
          <td class="api right-align">${planet.userData.magnitude}</td>
        </tr>
        <tr>
          <td class="left-align">Insolação: </td>
          <td class="api right-align">${planet.userData.insol}</td>
        </tr>
        <tr>
          <td class="left-align">RA: </td>
          <td class="api right-align">${planet.userData.ra}</td>
        </tr>
        <tr>
          <td class="left-align">Dec: </td>
          <td class="api right-align">${planet.userData.dec}</td>
        </tr>
      </tbody>
    </table>
  `;
}

// Loop de animação
function animate() {
  requestAnimationFrame(animate);
  if (isRotationEnabled) {
    scene.rotation.y += 0.001;
  }

  // Atualizar a posição dos planetas para simular a órbita
  if (currentStarSystem) {
    currentStarSystem.planets.forEach((planet) => {
      planet.userData.angle += 0.005; // Incrementar o ângulo para simular a órbita
      planet.position.set(
        currentStarSystem.starMesh.position.x +
          Math.cos(planet.userData.angle) * planet.userData.distance,
        0, // Manter a posição Y constante
        currentStarSystem.starMesh.position.z +
          Math.sin(planet.userData.angle) * planet.userData.distance
      );
    });
  }

  renderer.render(scene, camera);
}
