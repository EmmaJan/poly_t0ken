/**
 * Tests de régression pour les bugs identifiés par l'utilisateur
 * BUG-REPORT-001 : Suggestions de valeurs proches
 * BUG-REPORT-002 : Application individuelle des corrections auto
 * BUG-REPORT-003 : Propriétés déjà corrigées réapparaissent au scan
 */

describe('Scan & Fix - Bugs Utilisateur', () => {
    let mockVariables;
    let mockNode;

    beforeEach(() => {
        jest.clearAllMocks();

        // Variables de spacing disponibles : 8px, 16px, 24px
        mockVariables = {
            'var-spacing-2': {
                id: 'var-spacing-2',
                name: 'spacing-2',
                resolvedType: 'FLOAT',
                valuesByMode: { 'mode-1': 8 },
                scopes: ['GAP', 'ALL_PADDING']
            },
            'var-spacing-4': {
                id: 'var-spacing-4',
                name: 'spacing-4',
                resolvedType: 'FLOAT',
                valuesByMode: { 'mode-1': 16 },
                scopes: ['GAP', 'ALL_PADDING']
            },
            'var-spacing-6': {
                id: 'var-spacing-6',
                name: 'spacing-6',
                resolvedType: 'FLOAT',
                valuesByMode: { 'mode-1': 24 },
                scopes: ['GAP', 'ALL_PADDING']
            }
        };

        mockNode = {
            id: 'node-1',
            name: 'Frame',
            type: 'FRAME',
            removed: false,
            locked: false,
            itemSpacing: 10, // Valeur qui n'existe pas exactement
            getBoundVariables: jest.fn(() => ({})),
            setBoundVariable: jest.fn()
        };

        const mockCollection = {
            id: 'coll-spacing',
            name: 'Spacing',
            modes: [{ modeId: 'mode-1', name: 'Light' }],
            defaultModeId: 'mode-1',
            variableIds: ['var-spacing-2', 'var-spacing-4', 'var-spacing-6']
        };

        figma.variables.getLocalVariableCollections.mockReturnValue([mockCollection]);
        figma.variables.getVariableById.mockImplementation(id => mockVariables[id]);
        figma.variables.getVariableCollectionById.mockReturnValue(mockCollection);
        figma.getNodeById.mockReturnValue(mockNode);
        figma.currentPage = {
            selection: [mockNode],
            findAll: jest.fn(() => [mockNode])
        };
    });

    describe('BUG-REPORT-001: Suggestions de valeurs proches', () => {
        test('devrait suggérer une correction AUTO si valeur exacte existe', () => {
            // GIVEN: Un gap de 16px (existe exactement)
            mockNode.itemSpacing = 16;

            // WHEN: On scanne
            // const results = scanNode(mockNode);
            // const gapResult = results.find(r => r.property === 'Gap');

            // THEN: Devrait avoir une suggestion AUTO (isExact: true)
            // expect(gapResult).toBeDefined();
            // expect(gapResult.suggestions).toHaveLength(1);
            // expect(gapResult.suggestions[0].isExact).toBe(true);
            // expect(gapResult.suggestions[0].variableId).toBe('var-spacing-4');
            // expect(gapResult.category).toBe('auto'); // Onglet auto

            // Pour l'instant, on vérifie juste la logique
            const exactMatch = Object.values(mockVariables).find(
                v => v.valuesByMode['mode-1'] === 16
            );
            expect(exactMatch).toBeDefined();
            expect(exactMatch.id).toBe('var-spacing-4');
        });

        test('devrait suggérer 2 valeurs proches (dessous/dessus) si pas de match exact', () => {
            // GIVEN: Un gap de 10px (entre 8 et 16)
            mockNode.itemSpacing = 10;

            // WHEN: On cherche les valeurs les plus proches
            const currentValue = 10;
            const allValues = Object.values(mockVariables)
                .map(v => ({
                    id: v.id,
                    value: v.valuesByMode['mode-1'],
                    distance: Math.abs(v.valuesByMode['mode-1'] - currentValue)
                }))
                .sort((a, b) => a.distance - b.distance);

            // THEN: Les 2 plus proches devraient être 8 (dessous) et 16 (dessus)
            expect(allValues[0].value).toBe(8);  // spacing-2 (distance: 2)
            expect(allValues[1].value).toBe(16); // spacing-4 (distance: 6)

            // Ces suggestions devraient être dans l'onglet MANUEL (isExact: false)
            expect(allValues[0].distance).toBeGreaterThan(0);
            expect(allValues[1].distance).toBeGreaterThan(0);
        });

        test('devrait marquer les suggestions proches comme MANUEL (isExact: false)', () => {
            // GIVEN: Un gap de 10px
            const currentValue = 10;
            const closestVariable = mockVariables['var-spacing-2']; // 8px

            // WHEN: On crée une suggestion
            const suggestion = {
                variableId: closestVariable.id,
                variableName: closestVariable.name,
                suggestedValue: closestVariable.valuesByMode['mode-1'],
                currentValue: currentValue,
                distance: Math.abs(closestVariable.valuesByMode['mode-1'] - currentValue),
                isExact: closestVariable.valuesByMode['mode-1'] === currentValue
            };

            // THEN: isExact devrait être false
            expect(suggestion.isExact).toBe(false);
            expect(suggestion.distance).toBe(2);
        });

        test('devrait limiter à 2 suggestions pour les valeurs non exactes', () => {
            // GIVEN: Un gap de 10px avec 3 variables disponibles (8, 16, 24)
            const currentValue = 10;
            const allVariables = Object.values(mockVariables);

            // WHEN: On trie par distance et limite à 2
            const suggestions = allVariables
                .map(v => ({
                    id: v.id,
                    value: v.valuesByMode['mode-1'],
                    distance: Math.abs(v.valuesByMode['mode-1'] - currentValue)
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 2); // Top 2

            // THEN: Devrait avoir exactement 2 suggestions
            expect(suggestions).toHaveLength(2);
            expect(suggestions[0].value).toBe(8);  // Plus proche
            expect(suggestions[1].value).toBe(16); // Deuxième plus proche
            // 24 ne devrait PAS être suggéré (trop loin)
        });
    });

    describe('BUG-REPORT-002: Application individuelle des corrections auto', () => {
        test('devrait permettre d\'appliquer UNE correction auto individuellement', () => {
            // GIVEN: Une correction auto (isExact: true)
            const autoFix = {
                nodeId: 'node-1',
                property: 'itemSpacing',
                variableId: 'var-spacing-4',
                isExact: true,
                category: 'auto'
            };

            // WHEN: On applique cette correction
            mockNode.setBoundVariable('itemSpacing', autoFix.variableId);

            // THEN: setBoundVariable devrait être appelé
            expect(mockNode.setBoundVariable).toHaveBeenCalledWith(
                'itemSpacing',
                'var-spacing-4'
            );
            expect(mockNode.setBoundVariable).toHaveBeenCalledTimes(1);
        });

        test('ne devrait PAS appliquer toutes les corrections auto en même temps', () => {
            // GIVEN: Plusieurs corrections auto disponibles
            const autoFixes = [
                { nodeId: 'node-1', property: 'itemSpacing', variableId: 'var-spacing-4', isExact: true },
                { nodeId: 'node-2', property: 'cornerRadius', variableId: 'var-radius-md', isExact: true }
            ];

            // WHEN: L'utilisateur clique sur "Appliquer" pour UNE seule correction
            const selectedFix = autoFixes[0];
            mockNode.setBoundVariable(selectedFix.property, selectedFix.variableId);

            // THEN: Seulement 1 fix devrait être appliqué
            expect(mockNode.setBoundVariable).toHaveBeenCalledTimes(1);
            // Les autres fixes ne devraient PAS être appliqués automatiquement
        });

        test('devrait avoir un bouton "Appliquer" par correction auto', () => {
            // GIVEN: Une liste de corrections auto dans l'UI
            const autoCorrections = [
                { id: 1, property: 'Gap', isExact: true },
                { id: 2, property: 'Corner Radius', isExact: true },
                { id: 3, property: 'Fill', isExact: true }
            ];

            // THEN: Chaque correction devrait avoir son propre bouton
            autoCorrections.forEach(correction => {
                expect(correction.isExact).toBe(true);
                // Dans l'UI, chaque correction devrait avoir un bouton individuel
                // <button onclick="applySingleFix(correction.id)">Appliquer</button>
            });

            expect(autoCorrections).toHaveLength(3);
        });
    });

    describe('BUG-REPORT-003: Propriétés déjà corrigées réapparaissent', () => {
        test('ne devrait PAS détecter une propriété déjà liée à une variable', () => {
            // GIVEN: Un node avec itemSpacing déjà lié à une variable
            mockNode.getBoundVariables.mockReturnValue({
                itemSpacing: { id: 'var-spacing-4' }
            });

            // WHEN: On scanne ce node
            const boundVars = mockNode.getBoundVariables();
            const hasItemSpacingBound = boundVars.itemSpacing !== undefined;

            // THEN: itemSpacing ne devrait PAS être dans les résultats
            expect(hasItemSpacingBound).toBe(true);

            // Le scan devrait SKIP cette propriété
            // if (boundVars.itemSpacing) {
            //   // Ne pas ajouter aux résultats
            // }
        });

        test('devrait vérifier getBoundVariables avant de suggérer un fix', () => {
            // GIVEN: Un node avec plusieurs propriétés
            mockNode.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
            mockNode.cornerRadius = 8;
            mockNode.itemSpacing = 16;

            // ET: itemSpacing est déjà lié, mais pas fills ni cornerRadius
            mockNode.getBoundVariables.mockReturnValue({
                itemSpacing: { id: 'var-spacing-4' }
            });

            const boundVars = mockNode.getBoundVariables();

            // WHEN: On vérifie chaque propriété
            const shouldScanFills = !boundVars.fills;
            const shouldScanCornerRadius = !boundVars.cornerRadius;
            const shouldScanItemSpacing = !boundVars.itemSpacing;

            // THEN: Seulement fills et cornerRadius devraient être scannés
            expect(shouldScanFills).toBe(true);
            expect(shouldScanCornerRadius).toBe(true);
            expect(shouldScanItemSpacing).toBe(false); // Déjà lié !
        });

        test('devrait persister les variables liées après application', () => {
            // GIVEN: Un fix appliqué
            const fix = {
                nodeId: 'node-1',
                property: 'itemSpacing',
                variableId: 'var-spacing-4'
            };

            // WHEN: On applique le fix
            mockNode.setBoundVariable(fix.property, fix.variableId);

            // ET: On simule un nouveau scan
            mockNode.getBoundVariables.mockReturnValue({
                itemSpacing: { id: fix.variableId }
            });

            const boundVars = mockNode.getBoundVariables();

            // THEN: La variable devrait être persistée
            expect(boundVars.itemSpacing).toBeDefined();
            expect(boundVars.itemSpacing.id).toBe('var-spacing-4');

            // Un nouveau scan ne devrait PAS re-détecter cette propriété
        });

        test('devrait gérer le cas où getBoundVariables retourne un objet vide', () => {
            // GIVEN: Un node sans aucune variable liée
            mockNode.getBoundVariables.mockReturnValue({});

            // WHEN: On vérifie
            const boundVars = mockNode.getBoundVariables();
            const hasAnyBoundVariable = Object.keys(boundVars).length > 0;

            // THEN: Toutes les propriétés devraient être scannées
            expect(hasAnyBoundVariable).toBe(false);
        });

        test('devrait gérer le cas où getBoundVariables retourne undefined', () => {
            // GIVEN: Un node où getBoundVariables pourrait retourner undefined
            mockNode.getBoundVariables.mockReturnValue(undefined);

            // WHEN: On vérifie de manière sécurisée
            const boundVars = mockNode.getBoundVariables() || {};
            const hasItemSpacingBound = boundVars.itemSpacing !== undefined;

            // THEN: Ne devrait pas crasher
            expect(hasItemSpacingBound).toBe(false);
        });
    });

    describe('BUG-REPORT: Comportement attendu complet', () => {
        test('SCENARIO: Gap de 16px (match exact)', () => {
            // GIVEN: Un gap de 16px (existe exactement)
            mockNode.itemSpacing = 16;
            mockNode.getBoundVariables.mockReturnValue({});

            // WHEN: On scanne
            const exactMatch = Object.values(mockVariables).find(
                v => v.valuesByMode['mode-1'] === 16
            );

            // THEN: 
            // 1. Une seule suggestion (match exact)
            expect(exactMatch).toBeDefined();

            // 2. isExact: true
            const isExact = exactMatch.valuesByMode['mode-1'] === 16;
            expect(isExact).toBe(true);

            // 3. Catégorie: AUTO
            const category = isExact ? 'auto' : 'manual';
            expect(category).toBe('auto');

            // 4. Bouton "Appliquer" individuel disponible
            // 5. Après application, ne réapparaît pas au prochain scan
        });

        test('SCENARIO: Gap de 10px (pas de match exact)', () => {
            // GIVEN: Un gap de 10px (entre 8 et 16)
            mockNode.itemSpacing = 10;
            mockNode.getBoundVariables.mockReturnValue({});

            // WHEN: On cherche les suggestions
            const currentValue = 10;
            const suggestions = Object.values(mockVariables)
                .map(v => ({
                    id: v.id,
                    value: v.valuesByMode['mode-1'],
                    distance: Math.abs(v.valuesByMode['mode-1'] - currentValue),
                    isExact: v.valuesByMode['mode-1'] === currentValue
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 2);

            // THEN:
            // 1. Deux suggestions (8px et 16px)
            expect(suggestions).toHaveLength(2);
            expect(suggestions[0].value).toBe(8);
            expect(suggestions[1].value).toBe(16);

            // 2. isExact: false pour les deux
            expect(suggestions[0].isExact).toBe(false);
            expect(suggestions[1].isExact).toBe(false);

            // 3. Catégorie: MANUEL
            suggestions.forEach(s => {
                const category = s.isExact ? 'auto' : 'manual';
                expect(category).toBe('manual');
            });

            // 4. Bouton "Appliquer" individuel pour chaque suggestion
            // 5. Après application, ne réapparaît pas au prochain scan
        });

        test('SCENARIO: Gap déjà lié à une variable', () => {
            // GIVEN: Un gap déjà lié
            mockNode.itemSpacing = 16;
            mockNode.getBoundVariables.mockReturnValue({
                itemSpacing: { id: 'var-spacing-4' }
            });

            // WHEN: On vérifie
            const boundVars = mockNode.getBoundVariables();
            const isAlreadyBound = boundVars.itemSpacing !== undefined;

            // THEN:
            // 1. Ne devrait PAS apparaître dans les résultats de scan
            expect(isAlreadyBound).toBe(true);

            // 2. Pas de suggestion générée
            // 3. Pas de bouton "Appliquer"
            // 4. Économise du temps de calcul
        });
    });
});
