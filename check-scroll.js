// 🧪 Script de vérification rapide - À exécuter dans la console DevTools du plugin
// Ouvrir DevTools : Plugins > Development > Emma Plugin > Ouvrir la console

console.log('🔍 Vérification de la configuration du scroll horizontal...\n');

// 1. Vérifier les styles CSS
const checkStyles = () => {
    const smartRow = document.querySelector('.smart-suggestions-row');

    if (!smartRow) {
        console.log('⚠️  Aucune suggestion trouvée. Lancez un scan d\'abord !');
        return false;
    }

    const styles = window.getComputedStyle(smartRow);
    const results = {
        'overflow-x': styles.overflowX,
        'overflow-y': styles.overflowY,
        'flex-wrap': styles.flexWrap,
        'width': styles.width,
        'position': styles.position
    };

    console.log('📊 Styles de .smart-suggestions-row:');
    Object.entries(results).forEach(([prop, value]) => {
        const expected = {
            'overflow-x': 'auto',
            'overflow-y': 'visible',
            'flex-wrap': 'nowrap',
            'position': 'relative'
        };
        const isOk = expected[prop] ? value === expected[prop] : true;
        console.log(`  ${isOk ? '✅' : '❌'} ${prop}: ${value}`);
    });

    return true;
};

// 2. Vérifier les cartes
const checkCards = () => {
    const cards = document.querySelectorAll('.cleaning-result-card');

    if (cards.length === 0) {
        console.log('\n⚠️  Aucune carte trouvée');
        return;
    }

    const cardStyle = window.getComputedStyle(cards[0]);
    console.log(`\n📊 Styles de .cleaning-result-card:`);
    console.log(`  ${cardStyle.overflow === 'visible' ? '✅' : '❌'} overflow: ${cardStyle.overflow}`);
    console.log(`  📈 Nombre de cartes: ${cards.length}`);
};

// 3. Vérifier les pills
const checkPills = () => {
    const pills = document.querySelectorAll('.smart-pill');

    if (pills.length === 0) {
        console.log('\n⚠️  Aucune pill trouvée');
        return;
    }

    console.log(`\n📊 Pills:`);
    console.log(`  📈 Nombre total: ${pills.length}`);

    // Compter les pills par carte
    const cards = document.querySelectorAll('.cleaning-result-card');
    cards.forEach((card, i) => {
        const cardPills = card.querySelectorAll('.smart-pill');
        if (cardPills.length > 0) {
            console.log(`  📌 Carte ${i + 1}: ${cardPills.length} suggestions`);
        }
    });
};

// 4. Test de scroll
const testScroll = () => {
    const smartRow = document.querySelector('.smart-suggestions-row');

    if (!smartRow) return;

    console.log(`\n📊 Capacité de scroll:`);
    console.log(`  Largeur du conteneur: ${smartRow.offsetWidth}px`);
    console.log(`  Largeur du contenu: ${smartRow.scrollWidth}px`);
    console.log(`  ${smartRow.scrollWidth > smartRow.offsetWidth ? '✅ Scroll nécessaire' : '⚠️  Pas de scroll nécessaire'}`);

    if (smartRow.scrollWidth > smartRow.offsetWidth) {
        console.log(`  📏 Débordement: ${smartRow.scrollWidth - smartRow.offsetWidth}px`);
    }
};

// Exécuter tous les tests
const runAllChecks = () => {
    console.clear();
    console.log('🧪 === VÉRIFICATION DU SCROLL HORIZONTAL ===\n');

    const hasContent = checkStyles();
    if (hasContent) {
        checkCards();
        checkPills();
        testScroll();

        console.log('\n✅ Vérification terminée !');
        console.log('\n📝 Actions à tester manuellement:');
        console.log('  1. Scroller horizontalement dans les suggestions');
        console.log('  2. Survoler une pill (vérifier qu\'elle n\'est pas coupée)');
        console.log('  3. Cliquer sur "Ignorer" (vérifier l\'animation)');
        console.log('  4. Cliquer sur une suggestion puis "Ignorer" (vérifier le rollback)');
    } else {
        console.log('\n💡 Lancez un scan pour voir les suggestions !');
    }
};

// Lancer automatiquement
runAllChecks();

// Exposer la fonction pour relancer
window.checkScrollHorizontal = runAllChecks;
console.log('\n💡 Tapez checkScrollHorizontal() pour relancer les vérifications');
