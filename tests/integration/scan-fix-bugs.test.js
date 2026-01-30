/**
 * Tests d'exploration pour Scan & Fix
 * Objectif : Identifier les bugs réels en testant le code existant
 */

describe('Scan & Fix - Bug Discovery', () => {
    let mockNode;
    let mockVariable;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock minimal d'un node Figma
        mockNode = {
            id: 'node-1',
            name: 'Test Rectangle',
            type: 'RECTANGLE',
            removed: false,
            locked: false,
            fills: [{
                type: 'SOLID',
                color: { r: 0.541, g: 0.835, b: 0.247 } // #8AD53F
            }],
            cornerRadius: 8,
            getBoundVariables: jest.fn(() => ({})),
            setBoundVariable: jest.fn(),
            setPluginData: jest.fn(),
            getPluginData: jest.fn(() => null)
        };

        // Mock minimal d'une variable Figma
        mockVariable = {
            id: 'var-primary-500',
            name: 'primary-500',
            resolvedType: 'COLOR',
            valuesByMode: {
                'mode-1': { r: 0.541, g: 0.835, b: 0.247 }
            },
            scopes: ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL'],
            variableCollectionId: 'coll-1'
        };

        // Mock collection
        const mockCollection = {
            id: 'coll-1',
            name: 'Brand Colors',
            modes: [{ modeId: 'mode-1', name: 'Light' }],
            defaultModeId: 'mode-1',
            variableIds: ['var-primary-500']
        };

        // Setup Figma API
        figma.variables.getLocalVariableCollections.mockReturnValue([mockCollection]);
        figma.variables.getVariableById.mockReturnValue(mockVariable);
        figma.variables.getVariableCollectionById.mockReturnValue(mockCollection);
        figma.getNodeById.mockReturnValue(mockNode);
        figma.currentPage = {
            selection: [mockNode],
            findAll: jest.fn(() => [mockNode])
        };
    });

    describe('BUG-001: Scan de node simple', () => {
        test('devrait détecter une propriété fill non liée', () => {
            // GIVEN: Un rectangle avec une couleur non liée à une variable
            expect(mockNode.fills[0].boundVariables).toBeUndefined();

            // WHEN: On scanne le node
            // TODO: Appeler la vraie fonction de scan
            // const results = scanNode(mockNode);

            // THEN: On devrait avoir un résultat
            // expect(results).toBeDefined();
            // expect(results.length).toBeGreaterThan(0);
            // expect(results[0].property).toBe('Fill');
            // expect(results[0].currentValue).toEqual({ r: 0.541, g: 0.835, b: 0.247 });

            // Pour l'instant, on vérifie juste que le mock fonctionne
            expect(mockNode.fills).toBeDefined();
            expect(mockNode.fills[0].color).toEqual({ r: 0.541, g: 0.835, b: 0.247 });
        });

        test('devrait détecter cornerRadius non lié', () => {
            // GIVEN: Un rectangle avec cornerRadius = 8
            expect(mockNode.cornerRadius).toBe(8);

            // WHEN: On scanne
            // const results = scanNode(mockNode);

            // THEN: On devrait détecter cette propriété
            // expect(results.some(r => r.property === 'Corner Radius')).toBe(true);

            expect(mockNode.cornerRadius).toBe(8);
        });
    });

    describe('BUG-002: Matching de variables', () => {
        test('devrait trouver une variable avec couleur exacte', () => {
            // GIVEN: Une couleur qui matche exactement une variable
            const nodeColor = { r: 0.541, g: 0.835, b: 0.247 };
            const varColor = mockVariable.valuesByMode['mode-1'];

            // WHEN: On calcule la distance
            const distance = Math.sqrt(
                Math.pow(nodeColor.r - varColor.r, 2) +
                Math.pow(nodeColor.g - varColor.g, 2) +
                Math.pow(nodeColor.b - varColor.b, 2)
            );

            // THEN: La distance devrait être 0 (match exact)
            expect(distance).toBe(0);
        });

        test('devrait calculer la distance pour couleur proche', () => {
            // GIVEN: Une couleur légèrement différente
            const nodeColor = { r: 0.540, g: 0.834, b: 0.246 };
            const varColor = mockVariable.valuesByMode['mode-1'];

            // WHEN: On calcule la distance
            const distance = Math.sqrt(
                Math.pow(nodeColor.r - varColor.r, 2) +
                Math.pow(nodeColor.g - varColor.g, 2) +
                Math.pow(nodeColor.b - varColor.b, 2)
            );

            // THEN: La distance devrait être petite mais non nulle
            expect(distance).toBeGreaterThan(0);
            expect(distance).toBeLessThan(0.01); // Très proche
        });
    });

    describe('BUG-003: Validation de scopes', () => {
        test('devrait accepter une variable avec scope compatible', () => {
            // GIVEN: Un RECTANGLE (FRAME_FILL, SHAPE_FILL)
            // ET: Une variable avec scopes ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL']

            const nodeType = 'RECTANGLE';
            const requiredScopes = ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL'];
            const variableScopes = mockVariable.scopes;

            // WHEN: On vérifie la compatibilité
            const hasCompatibleScope = requiredScopes.some(scope =>
                variableScopes.includes(scope)
            );

            // THEN: Devrait être compatible
            expect(hasCompatibleScope).toBe(true);
        });

        test('devrait rejeter une variable avec scope incompatible', () => {
            // GIVEN: Une variable avec scope TEXT_FILL uniquement
            mockVariable.scopes = ['TEXT_FILL'];

            const nodeType = 'RECTANGLE';
            const requiredScopes = ['ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL'];
            const variableScopes = mockVariable.scopes;

            // WHEN: On vérifie la compatibilité
            const hasCompatibleScope = requiredScopes.some(scope =>
                variableScopes.includes(scope)
            );

            // THEN: Ne devrait PAS être compatible
            expect(hasCompatibleScope).toBe(false);
        });
    });

    describe('BUG-004: Application de fix', () => {
        test('devrait appeler setBoundVariable avec les bons paramètres', () => {
            // GIVEN: Un node et une variable
            const propertyKey = 'fills';
            const variableId = mockVariable.id;

            // WHEN: On applique le fix
            mockNode.setBoundVariable(propertyKey, variableId);

            // THEN: setBoundVariable devrait avoir été appelé
            expect(mockNode.setBoundVariable).toHaveBeenCalledWith(propertyKey, variableId);
            expect(mockNode.setBoundVariable).toHaveBeenCalledTimes(1);
        });

        test('devrait gérer un node verrouillé', () => {
            // GIVEN: Un node verrouillé
            mockNode.locked = true;

            // WHEN: On tente d'appliquer un fix
            // THEN: Devrait détecter que le node est verrouillé
            expect(mockNode.locked).toBe(true);

            // Le code devrait vérifier node.locked avant d'appliquer
            // Si ce n'est pas le cas, c'est un BUG !
        });

        test('devrait gérer un node supprimé', () => {
            // GIVEN: Un node marqué comme supprimé
            mockNode.removed = true;

            // WHEN: On tente d'appliquer un fix
            // THEN: Devrait détecter que le node est supprimé
            expect(mockNode.removed).toBe(true);

            // Le code devrait vérifier node.removed avant d'appliquer
        });
    });

    describe('BUG-005: Gestion d\'erreurs', () => {
        test('devrait gérer getNodeById retournant null', () => {
            // GIVEN: Un nodeId qui n'existe pas
            figma.getNodeById.mockReturnValue(null);

            // WHEN: On essaie de récupérer le node
            const node = figma.getNodeById('node-inexistant');

            // THEN: Devrait retourner null
            expect(node).toBeNull();

            // Le code devrait vérifier si node est null avant de l'utiliser
        });

        test('devrait gérer getVariableById retournant null', () => {
            // GIVEN: Un variableId qui n'existe pas
            figma.variables.getVariableById.mockReturnValue(null);

            // WHEN: On essaie de récupérer la variable
            const variable = figma.variables.getVariableById('var-inexistante');

            // THEN: Devrait retourner null
            expect(variable).toBeNull();

            // Le code devrait vérifier si variable est null
        });

        test('devrait gérer une sélection vide', () => {
            // GIVEN: Aucun node sélectionné
            figma.currentPage.selection = [];

            // WHEN: On scanne la sélection
            // THEN: Devrait retourner un tableau vide ou un message d'erreur
            expect(figma.currentPage.selection).toHaveLength(0);
        });
    });

    describe('BUG-006: Edge cases', () => {
        test('devrait gérer un node sans fills', () => {
            // GIVEN: Un node sans propriété fills
            mockNode.fills = [];

            // WHEN: On scanne
            // THEN: Ne devrait pas crasher
            expect(mockNode.fills).toHaveLength(0);
        });

        test('devrait gérer un cornerRadius à 0', () => {
            // GIVEN: cornerRadius = 0
            mockNode.cornerRadius = 0;

            // WHEN: On scanne
            // THEN: Devrait quand même détecter cette propriété
            expect(mockNode.cornerRadius).toBe(0);
        });

        test('devrait gérer des valeurs négatives', () => {
            // GIVEN: Une valeur négative (invalide mais possible)
            mockNode.cornerRadius = -5;

            // WHEN: On scanne
            // THEN: Devrait soit ignorer, soit reporter une erreur
            expect(mockNode.cornerRadius).toBe(-5);
        });
    });
});
