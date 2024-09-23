# Exoplanets Exploration

Este projeto visualiza sistemas estelares com exoplanetas usando a biblioteca Three.js. Ele carrega dados de exoplanetas a partir de um arquivo JSON e gera um sistema estelar aleatório com planetas orbitando ao redor de uma estrela.

O projeto ainda esta em andamento, e faz parte do desafio do [hackathon promovido pela NASA.](https://www.spaceappschallenge.org/)

# Funcionalidades

- Geração de sistemas estelares aleatórios.
- Visualização de planetas orbitando suas estrelas.
- Exibição de informações detalhadas sobre os exoplanetas ao clicar neles.
- Controle de rotação da cena.

# Como Executar
### Pré-requisitos
- Node.js e npm instalados.

### Passos

- Clone o repositório:

```sh
 https://github.com/DGzzzzz/Hackathon-NASA.git
```
- Instale as dependências:
```sh
npm install
```
- Inicie o servidor de desenvolvimento:
```sh
npm run dev
```

# Estrutura do Projeto

- index.html: Arquivo HTML principal.
- main.js: Script principal que configura a cena, carrega dados e gera os sistemas estelares.
- assets/: Contém imagens e dados JSON.
- images/: Texturas para o universo e planetas.
- data.json: Dados dos exoplanetas.

# Dependências
- [Three.js:](https://threejs.org/) Biblioteca para renderização 3D.
- [Vite:](https://vitejs.dev/) Ferramenta de build e servidor de desenvolvimento.

# Controles
- Gerar Novos Exoplanetas: Gera um novo sistema estelar aleatório.
- Ativar/Desativar Rotação: Ativa ou desativa a rotação da cena.
