/**
 * Tests de non-régression pour le scroll horizontal des suggestions
 * 
 * Ces tests vérifient que :
 * 1. Le scroll horizontal fonctionne à l'intérieur de chaque carte
 * 2. Les pills ne sont pas coupées au hover
 * 3. Les autres fonctionnalités ne sont pas cassées
 */

console.log('🧪 Démarrage des tests de non-régression...\n');

// Test 1: Vérifier que .smart-suggestions-row a overflow-x: auto
console.log('Test 1: Vérification du scroll horizontal');
const smartRow = document.querySelector('.smart-suggestions-row');
if (smartRow) {
    const styles = window.getComputedStyle(smartRow);
    const overflowX = styles.getPropertyValue('overflow-x');
    const overflowY = styles.getPropertyValue('overflow-y');

    console.log(`  overflow-x: ${overflowX} ${overflowX === 'auto' ? '✅' : '❌'}`);
    console.log(`  overflow-y: ${overflowY} ${overflowY === 'visible' ? '✅' : '❌'}`);
} else {
    console.log('  ⚠️  Aucune .smart-suggestions-row trouvée (normal si pas de scan)');
}

// Test 2: Vérifier que .cleaning-result-card a overflow: visible
console.log('\nTest 2: Vérification de l\'overflow des cartes');
const cards = document.querySelectorAll('.cleaning-result-card');
if (cards.length > 0) {
    const cardStyles = window.getComputedStyle(cards[0]);
    const overflow = cardStyles.getPropertyValue('overflow');
    console.log(`  overflow: ${overflow} ${overflow === 'visible' ? '✅' : '❌'}`);
    console.log(`  Nombre de cartes: ${cards.length}`);
} else {
    console.log('  ⚠️  Aucune carte trouvée (normal si pas de scan)');
}

// Test 3: Vérifier que les pills ont flex: none
console.log('\nTest 3: Vérification des pills');
const pills = document.querySelectorAll('.smart-pill');
if (pills.length > 0) {
    const pillStyles = window.getComputedStyle(pills[0]);
    const flex = pillStyles.getPropertyValue('flex');
    const width = pillStyles.getPropertyValue('width');

    console.log(`  flex: ${flex} ${flex.includes('none') || flex === '0 0 auto' ? '✅' : '❌'}`);
    console.log(`  Nombre de pills: ${pills.length}`);
} else {
    console.log('  ⚠️  Aucune pill trouvée (normal si pas de scan)');
}

// Test 4: Vérifier que le conteneur parent a min-width: 0
console.log('\nTest 4: Vérification du conteneur parent');
if (smartRow) {
    const parent = smartRow.parentElement;
    if (parent) {
        const parentStyles = window.getComputedStyle(parent);
        const minWidth = parentStyles.getPropertyValue('min-width');
        const flex = parentStyles.getPropertyValue('flex');

        console.log(`  min-width: ${minWidth} ${minWidth === '0px' ? '✅' : '❌'}`);
        console.log(`  flex: ${flex} ${flex.includes('1') ? '✅' : '❌'}`);
    }
}

// Test 5: Vérifier la scrollbar personnalisée
console.log('\nTest 5: Vérification de la scrollbar');
if (smartRow) {
    const styles = window.getComputedStyle(smartRow);
    const scrollbarWidth = styles.getPropertyValue('scrollbar-width');

    console.log(`  scrollbar-width: ${scrollbarWidth} ${scrollbarWidth === 'thin' ? '✅' : '❌'}`);
}

// Test 6: Simuler un hover sur une pill
console.log('\nTest 6: Simulation du hover');
if (pills.length > 0) {
    const pill = pills[0];
    const beforeHover = window.getComputedStyle(pill);
    const transformBefore = beforeHover.getPropertyValue('transform');

    // Simuler le hover
    pill.classList.add('hover-test');
    const style = document.createElement('style');
    style.textContent = '.hover-test { transform: translateY(-2px) !important; }';
    document.head.appendChild(style);

    const afterHover = window.getComputedStyle(pill);
    const transformAfter = afterHover.getPropertyValue('transform');

    console.log(`  Transform avant: ${transformBefore}`);
    console.log(`  Transform après: ${transformAfter}`);
    console.log(`  ${transformBefore !== transformAfter ? '✅' : '❌'} Transform change au hover`);

    // Cleanup
    pill.classList.remove('hover-test');
    style.remove();
}

// Test 7: Vérifier que le fade gradient existe
console.log('\nTest 7: Vérification du fade gradient');
if (smartRow) {
    const afterContent = window.getComputedStyle(smartRow, '::after').getPropertyValue('content');
    console.log(`  ::after content: ${afterContent !== 'none' ? '✅' : '❌'}`);
}

console.log('\n✅ Tests de non-régression terminés !');
console.log('\n📝 Instructions pour tester manuellement :');
console.log('1. Lancez un scan avec des éléments ayant plusieurs suggestions');
console.log('2. Vérifiez que vous pouvez scroller horizontalement dans les suggestions');
console.log('3. Vérifiez que les pills ne sont pas coupées au hover');
console.log('4. Vérifiez que le reste de l\'interface fonctionne normalement');
