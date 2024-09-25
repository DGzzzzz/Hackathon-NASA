describe('DOM Reander', () =>
{
    it('Verifica se o DOM foi renderizado', () =>
    {
        cy.visit('http://localhost:5173/', { timeout: 10000 })
        cy.wait(5000)
    })
})

describe('JSON API', () =>
{
    it('verifica se a API conecta', () =>
    {
        const jsonFilePath = 'http://localhost:5173/assets/data.json';
        cy.request(jsonFilePath).then((response) =>
        {
            expect(response.status).to.eq(200)
        })
    })
})
