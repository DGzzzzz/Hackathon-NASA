describe('DOM Reander', () =>
{
    it('Verifica se o DOM foi renderizado', () =>
    {
        cy.visit('http://localhost:5173/', { timeout: 10000 })
        cy.wait(5000)
    })
})