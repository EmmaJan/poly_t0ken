    // ============================================
    // STATE
    // ============================================
    var currentColor = "#6366F1";
    var currentNaming = "custom"; // Valeur par défaut
    var currentTokens = null;
    // semanticPreview supprimé - les sémantiques sont maintenant affichées comme les primitives
    var selectedFile = null;
    var activeCategory = "brand";
    var currentStep = 0;
    var lastScanResults = null; // Stockage global des résultats du dernier scan
    var livePreviewReady = false; // Indicateur simple : système prêt pour Live Preview
    var lastBatchHistory = null; // Historique du dernier batch de corrections pour l'annulation

    // ============================================
    // SEMANTIC TOKENS MAPPINGS - Source de vérité unique
    // ============================================
    var SEMANTIC_NAME_MAP = window.SEMANTIC_NAME_MAP || {
      tailwind: {
        // Background
        'bg.canvas': 'background/canvas',
        'bg.surface': 'background/surface',
        'bg.elevated': 'background/elevated',
        'bg.muted': 'background/muted',
        'bg.inverse': 'background/inverse',

        // Text
        'text.primary': 'text/primary',
        'text.secondary': 'text/secondary',
        'text.muted': 'text/muted',
        'text.inverse': 'text/inverse',
        'text.disabled': 'text/disabled',

        // Border
        'border.default': 'border/default',
        'border.muted': 'border/muted',

        // Action
        'action.primary.default': 'primary/default',
        'action.primary.hover': 'primary/hover',
        'action.primary.active': 'primary/active',
        'action.primary.disabled': 'primary/disabled',

        // Status
        'status.success': 'success/default',
        'status.warning': 'warning/default',
        'status.error': 'destructive/default',
        'status.info': 'info/default',

        // Shape & Space
        'radius.sm': 'radius/sm',
        'radius.md': 'radius/md',
        'space.sm': 'space/sm',
        'space.md': 'space/md',

        // Typography
        'font.size.base': 'font/size/base',
        'font.weight.base': 'font/weight/base'
      },

      mui: {
        // Background
        'bg.canvas': 'palette/background/default',
        'bg.surface': 'palette/background/paper',
        'bg.elevated': 'palette/background/paper',
        'bg.muted': 'palette/action/disabledBackground',
        'bg.inverse': 'palette/grey/900',

        // Text
        'text.primary': 'palette/text/primary',
        'text.secondary': 'palette/text/secondary',
        'text.muted': 'palette/text/disabled',
        'text.inverse': 'palette/common/white',
        'text.disabled': 'palette/text/disabled',

        // Border
        'border.default': 'palette/divider',
        'border.muted': 'palette/divider',

        // Action
        'action.primary.default': 'palette/primary/main',
        'action.primary.hover': 'palette/primary/dark',
        'action.primary.active': 'palette/primary/dark',
        'action.primary.disabled': 'palette/action/disabled',

        // Status
        'status.success': 'palette/success/main',
        'status.warning': 'palette/warning/main',
        'status.error': 'palette/error/main',
        'status.info': 'palette/info/main',

        // Shape & Space
        'radius.sm': 'shape/borderRadius',
        'radius.md': 'shape/borderRadius',
        'space.sm': 'spacing',
        'space.md': 'spacing',

        // Typography
        'font.size.base': 'typography/fontSize',
        'font.weight.base': 'typography/fontWeightRegular'
      },

      ant: {
        // Background
        'bg.canvas': 'colorBgLayout',
        'bg.surface': 'colorBgContainer',
        'bg.elevated': 'colorBgElevated',
        'bg.muted': 'colorBgTextHover',
        'bg.inverse': 'colorTextBase',

        // Text
        'text.primary': 'colorText',
        'text.secondary': 'colorTextSecondary',
        'text.muted': 'colorTextQuaternary',
        'text.inverse': 'colorTextLightSolid',
        'text.disabled': 'colorTextDisabled',

        // Border
        'border.default': 'colorBorder',
        'border.muted': 'colorBorderSecondary',

        // Action
        'action.primary.default': 'colorPrimary',
        'action.primary.hover': 'colorPrimaryHover',
        'action.primary.active': 'colorPrimaryActive',
        'action.primary.disabled': 'colorPrimaryBg',

        // Status
        'status.success': 'colorSuccess',
        'status.warning': 'colorWarning',
        'status.error': 'colorError',
        'status.info': 'colorInfo',

        // Shape & Space
        'radius.sm': 'borderRadiusSM',
        'radius.md': 'borderRadius',
        'space.sm': 'paddingSM',
        'space.md': 'padding',

        // Typography
        'font.size.base': 'fontSize',
        'font.weight.base': 'fontWeightNormal'
      },

      bootstrap: {
        // Background
        'bg.canvas': '$body-bg',
        'bg.surface': '$card-bg',
        'bg.elevated': '$modal-content-bg',
        'bg.muted': '$secondary-bg',
        'bg.inverse': '$body-color',

        // Text
        'text.primary': '$body-color',
        'text.secondary': '$secondary-color',
        'text.muted': '$text-muted',
        'text.inverse': '$white',
        'text.disabled': '$btn-disabled-color',

        // Border
        'border.default': '$border-color',
        'border.muted': '$border-color-translucent',

        // Action
        'action.primary.default': '$primary',
        'action.primary.hover': '$primary',
        'action.primary.active': '$primary',
        'action.primary.disabled': '$primary',

        // Status
        'status.success': '$success',
        'status.warning': '$warning',
        'status.error': '$danger',
        'status.info': '$info',

        // Shape & Space
        'radius.sm': '$border-radius-sm',
        'radius.md': '$border-radius',
        'space.sm': '$spacer',
        'space.md': '$spacer',

        // Typography
        'font.size.base': '$font-size-base',
        'font.weight.base': '$font-weight-base'
      }
    };

    /**
     * Retourne le nom de variable sémantique selon la librairie
     * @param {string} semanticKey - Clé sémantique (ex: 'bg.canvas')
     * @param {string} libType - Type de librairie ('tailwind', 'mui', 'ant', 'bootstrap')
     * @returns {string} Nom de variable adapté
     */
    function getSemanticVariableName(semanticKey, libType) {
      const mapping = SEMANTIC_NAME_MAP[libType] || SEMANTIC_NAME_MAP.tailwind;
      return mapping[semanticKey] || semanticKey.replace(/\./g, '/');
    }

    // ============================================
    // ICONS
    // ============================================
    const ICONS = {
      fill: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
      stroke: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
      radius: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
      spacing: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="1"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="14" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>',
      logo: '<svg xmlns="http://www.w3.org/2000/svg" width="329" height="36" viewBox="0 0 329 36" fill="none"><path d="M1.48278 25.3976C1.48278 31.1143 5.81112 35.7461 11.1594 35.7461H17.022V30.4083H12.2736C9.06809 30.4083 7.03677 27.6275 7.03677 24.2009V20.6711L4.16549 17.8731L7.03677 15.075V11.5452C7.03677 8.11864 9.06809 5.33781 12.2736 5.33781L17.022 5.33781V5.1252e-07L11.1594 0C5.8197 -4.66813e-07 1.48278 4.63184 1.48278 10.3485L1.48278 12.7419L6.27715e-07 14.2916L0 21.4718L1.48278 23.0215L1.48278 25.4149V25.3976Z" fill="#96D700"/><path d="M22.9807 27.3276C21.3063 27.3276 19.9595 26.6997 18.9403 25.4438C17.9392 24.1698 17.4387 22.4317 17.4387 20.2294C17.4387 18.7552 17.7026 17.4902 18.2304 16.4346C18.7765 15.379 19.4772 14.5691 20.3326 14.0049C21.2062 13.4225 22.1162 13.1313 23.0626 13.1313C23.8089 13.1313 24.4368 13.2587 24.9464 13.5135C25.456 13.7683 25.9383 14.1141 26.3933 14.5509L26.2295 12.476V7.86224H30.2427V27H26.9666L26.6936 25.6622H26.5844C26.1112 26.1354 25.5561 26.5358 24.9191 26.8635C24.2821 27.1729 23.636 27.3276 22.9807 27.3276ZM24.0182 24.0515C24.455 24.0515 24.8554 23.9605 25.2194 23.7785C25.5834 23.5965 25.9201 23.278 26.2295 22.823V17.2809C25.8837 16.9533 25.5197 16.7258 25.1375 16.5984C24.7553 16.471 24.3731 16.4073 23.9909 16.4073C23.5541 16.4073 23.1536 16.5438 22.7896 16.8168C22.4256 17.0898 22.1253 17.5085 21.8887 18.0727C21.6703 18.6187 21.5611 19.3194 21.5611 20.1748C21.5611 21.5034 21.7795 22.4863 22.2163 23.1233C22.6531 23.7421 23.2538 24.0515 24.0182 24.0515Z" fill="white"/><path d="M39.8591 27.3276C38.5669 27.3276 37.4021 27.0455 36.3646 26.4812C35.3272 25.917 34.5082 25.1071 33.9076 24.0515C33.307 22.9959 33.0067 21.7218 33.0067 20.2294C33.0067 18.7552 33.307 17.4902 33.9076 16.4346C34.5264 15.379 35.3272 14.5691 36.31 14.0049C37.2929 13.4225 38.3212 13.1313 39.395 13.1313C40.6872 13.1313 41.7611 13.4225 42.6165 14.0049C43.4719 14.5691 44.1089 15.3426 44.5275 16.3254C44.9461 17.3082 45.1554 18.4094 45.1554 19.6288C45.1554 19.9746 45.1372 20.3204 45.1008 20.6662C45.0644 20.9938 45.028 21.2577 44.9916 21.4579H36.1189L36.0643 18.6733H41.7156C41.7156 17.9635 41.5427 17.381 41.1969 16.926C40.851 16.4528 40.2777 16.2162 39.4769 16.2162C39.0401 16.2162 38.6124 16.3345 38.1938 16.5711C37.7752 16.8077 37.4294 17.2172 37.1564 17.7997C36.8834 18.3821 36.756 19.192 36.7742 20.2294C36.7924 21.2486 36.9744 22.0494 37.3202 22.6319C37.6842 23.2143 38.1392 23.6329 38.6852 23.8877C39.2312 24.1243 39.8045 24.2426 40.4051 24.2426C40.9329 24.2426 41.4335 24.1698 41.9067 24.0242C42.3981 23.8604 42.8804 23.642 43.3536 23.369L44.664 25.826C43.9906 26.2992 43.2262 26.6724 42.3708 26.9454C41.5154 27.2002 40.6781 27.3276 39.8591 27.3276Z" fill="white"/><path d="M51.9145 27.3276C51.0226 27.3276 50.1035 27.1547 49.1571 26.8089C48.2107 26.463 47.4008 25.9625 46.7274 25.3073L48.42 23.0414C49.0388 23.5328 49.6485 23.8786 50.2491 24.0788C50.8679 24.2608 51.4595 24.3518 52.0237 24.3518C52.6243 24.3518 53.0611 24.2517 53.3341 24.0515C53.6071 23.8331 53.7436 23.551 53.7436 23.2052C53.7436 22.8958 53.6162 22.641 53.3614 22.4408C53.1248 22.2406 52.8063 22.0677 52.4059 21.922C52.0237 21.7582 51.5869 21.5853 51.0954 21.4033C50.4402 21.1667 49.8396 20.8664 49.2936 20.5024C48.7476 20.1384 48.3017 19.7016 47.9559 19.192C47.6283 18.6824 47.4645 18.0727 47.4645 17.3628C47.4645 16.0888 47.9377 15.0696 48.8841 14.3052C49.8487 13.5226 51.1045 13.1313 52.6516 13.1313C53.6344 13.1313 54.5262 13.2951 55.327 13.6227C56.1461 13.9321 56.8468 14.3416 57.4292 14.8512L55.7092 17.0898C55.2178 16.744 54.7264 16.4983 54.235 16.3527C53.7436 16.1889 53.2613 16.107 52.7881 16.107C52.2603 16.107 51.869 16.2071 51.6142 16.4073C51.3594 16.6075 51.232 16.8623 51.232 17.1717C51.232 17.4265 51.323 17.645 51.505 17.827C51.687 18.009 51.96 18.1819 52.324 18.3457C52.7062 18.4913 53.1794 18.6551 53.7436 18.8371C54.4352 19.0737 55.0631 19.374 55.6273 19.738C56.2098 20.0838 56.6648 20.5206 56.9924 21.0484C57.32 21.5762 57.4838 22.2133 57.4838 22.9595C57.4838 23.7785 57.2654 24.5156 56.8286 25.1708C56.41 25.826 55.7912 26.3538 54.9721 26.7543C54.1531 27.1365 53.1339 27.3276 51.9145 27.3276Z" fill="white"/><path d="M60.0326 27V13.4589H64.0457V27H60.0326ZM62.0255 11.4659C61.3521 11.4659 60.8061 11.2748 60.3875 10.8926C59.9689 10.5104 59.7595 10.0008 59.7595 9.36377C59.7595 8.72676 59.9689 8.21715 60.3875 7.83494C60.8061 7.45273 61.3521 7.26163 62.0255 7.26163C62.6989 7.26163 63.2449 7.45273 63.6635 7.83494C64.0821 8.21715 64.2914 8.72676 64.2914 9.36377C64.2914 10.0008 64.0821 10.5104 63.6635 10.8926C63.2449 11.2748 62.6989 11.4659 62.0255 11.4659Z" fill="white"/><path d="M72.4097 32.7604C71.3541 32.7604 70.3895 32.633 69.5159 32.3782C68.6605 32.1416 67.978 31.7685 67.4683 31.2589C66.9769 30.7674 66.7312 30.1213 66.7312 29.3205C66.7312 28.7563 66.895 28.2467 67.2226 27.7917C67.5684 27.3367 68.0507 26.9363 68.6696 26.5904V26.4812C68.3238 26.2446 68.0234 25.9443 67.7686 25.5803C67.532 25.1981 67.4137 24.734 67.4137 24.188C67.4137 23.6966 67.5593 23.2325 67.8505 22.7957C68.1418 22.3407 68.5058 21.9584 68.9426 21.649V21.5398C68.4512 21.2122 68.0234 20.739 67.6594 20.1202C67.2954 19.5014 67.1134 18.8007 67.1134 18.0181C67.1134 16.9442 67.3773 16.0433 67.9051 15.3153C68.433 14.5873 69.1246 14.0413 69.98 13.6773C70.8354 13.3133 71.7454 13.1313 72.7101 13.1313C73.0923 13.1313 73.4563 13.1586 73.8021 13.2132C74.1661 13.2678 74.5028 13.3497 74.8122 13.4589H79.7536V16.38H77.4877V16.4892C77.6697 16.7258 77.8062 16.9897 77.8972 17.2809C77.9882 17.554 78.0337 17.8634 78.0337 18.2092C78.0337 19.2284 77.7971 20.0747 77.3239 20.7481C76.8506 21.4033 76.2045 21.8947 75.3855 22.2224C74.5847 22.55 73.6929 22.7138 72.7101 22.7138C72.4734 22.7138 72.2186 22.6956 71.9456 22.6592C71.6726 22.6046 71.3814 22.5318 71.072 22.4408C70.9082 22.5864 70.7808 22.732 70.6898 22.8776C70.617 23.0232 70.5806 23.2143 70.5806 23.4509C70.5806 23.7785 70.7353 24.0333 71.0447 24.2153C71.3541 24.3791 71.8819 24.461 72.6281 24.461H74.8122C76.4866 24.461 77.7607 24.734 78.6343 25.28C79.5261 25.8078 79.972 26.6814 79.972 27.9009C79.972 28.8291 79.6626 29.6572 79.0438 30.3852C78.425 31.1314 77.5514 31.7139 76.4229 32.1325C75.2945 32.5511 73.9568 32.7604 72.4097 32.7604ZM72.7101 20.284C73.0741 20.284 73.3926 20.2021 73.6656 20.0383C73.9386 19.8563 74.157 19.6015 74.3208 19.2739C74.4846 18.9463 74.5665 18.5277 74.5665 18.0181C74.5665 17.29 74.3845 16.744 74.0205 16.38C73.6747 16.016 73.2379 15.834 72.7101 15.834C72.1822 15.834 71.7363 16.016 71.3723 16.38C71.0265 16.744 70.8536 17.29 70.8536 18.0181C70.8536 18.5277 70.9355 18.9463 71.0993 19.2739C71.2813 19.6015 71.5088 19.8563 71.7818 20.0383C72.0548 20.2021 72.3642 20.284 72.7101 20.284ZM73.0377 30.2487C73.6383 30.2487 74.1661 30.1759 74.6211 30.0303C75.0943 29.8847 75.4674 29.6845 75.7404 29.4297C76.0134 29.1749 76.1499 28.8928 76.1499 28.5834C76.1499 28.1466 75.9679 27.8554 75.6039 27.7098C75.2399 27.5824 74.7303 27.5187 74.0751 27.5187H72.6827C72.2095 27.5187 71.8273 27.5005 71.5361 27.4641C71.2631 27.4459 71.0083 27.4095 70.7717 27.3549C70.5169 27.5733 70.3258 27.7826 70.1984 27.9828C70.0892 28.2012 70.0346 28.4378 70.0346 28.6926C70.0346 29.2022 70.3076 29.5844 70.8536 29.8392C71.4178 30.1122 72.1458 30.2487 73.0377 30.2487Z" fill="white"/><path d="M82.161 27V13.4589H85.437L85.71 15.1788H85.8192C86.3835 14.6146 87.0205 14.1323 87.7303 13.7319C88.4401 13.3315 89.25 13.1313 90.16 13.1313C91.6525 13.1313 92.7263 13.6227 93.3815 14.6055C94.0367 15.5701 94.3643 16.8987 94.3643 18.5914V27H90.3511V19.1101C90.3511 18.1273 90.2146 17.4538 89.9416 17.0898C89.6868 16.7258 89.2682 16.5438 88.6858 16.5438C88.1762 16.5438 87.7394 16.6621 87.3754 16.8987C87.0114 17.1171 86.611 17.4356 86.1741 17.8543V27H82.161Z" fill="white"/><path d="M107.208 24.4337V19.4104H102.403V16.5711H107.208V11.5478H110.157V16.5711H114.962V19.4104H110.157V24.4337H107.208Z" fill="#96D700"/><path d="M127.971 27.3276C126.296 27.3276 124.949 26.6997 123.93 25.4438C122.929 24.1698 122.429 22.4317 122.429 20.2294C122.429 18.7552 122.693 17.4902 123.22 16.4346C123.766 15.379 124.467 14.5691 125.323 14.0049C126.196 13.4225 127.106 13.1313 128.053 13.1313C128.799 13.1313 129.427 13.2587 129.936 13.5135C130.446 13.7683 130.928 14.1141 131.383 14.5509L131.219 12.476V7.86224H135.233V27H131.957L131.684 25.6622H131.574C131.101 26.1354 130.546 26.5358 129.909 26.8635C129.272 27.1729 128.626 27.3276 127.971 27.3276ZM129.008 24.0515C129.445 24.0515 129.845 23.9605 130.209 23.7785C130.573 23.5965 130.91 23.278 131.219 22.823V17.2809C130.874 16.9533 130.51 16.7258 130.127 16.5984C129.745 16.471 129.363 16.4073 128.981 16.4073C128.544 16.4073 128.144 16.5438 127.78 16.8168C127.416 17.0898 127.115 17.5085 126.879 18.0727C126.66 18.6187 126.551 19.3194 126.551 20.1748C126.551 21.5034 126.769 22.4863 127.206 23.1233C127.643 23.7421 128.244 24.0515 129.008 24.0515Z" fill="white"/><path d="M144.849 27.3276C143.557 27.3276 142.392 27.0455 141.355 26.4812C140.317 25.917 139.498 25.1071 138.898 24.0515C138.297 22.9959 137.997 21.7218 137.997 20.2294C137.997 18.7552 138.297 17.4902 138.898 16.4346C139.516 15.379 140.317 14.5691 141.3 14.0049C142.283 13.4225 143.311 13.1313 144.385 13.1313C145.677 13.1313 146.751 13.4225 147.606 14.0049C148.462 14.5691 149.099 15.3426 149.518 16.3254C149.936 17.3082 150.145 18.4094 150.145 19.6288C150.145 19.9746 150.127 20.3204 150.091 20.6662C150.054 20.9938 150.018 21.2577 149.982 21.4579H141.109L141.054 18.6733H146.706C146.706 17.9635 146.533 17.381 146.187 16.926C145.841 16.4528 145.268 16.2162 144.467 16.2162C144.03 16.2162 143.602 16.3345 143.184 16.5711C142.765 16.8077 142.419 17.2172 142.146 17.7997C141.873 18.3821 141.746 19.192 141.764 20.2294C141.782 21.2486 141.964 22.0494 142.31 22.6319C142.674 23.2143 143.129 23.6329 143.675 23.8877C144.221 24.1243 144.795 24.2426 145.395 24.2426C145.923 24.2426 146.423 24.1698 146.897 24.0242C147.388 23.8604 147.87 23.642 148.344 23.369L149.654 25.826C148.981 26.2992 148.216 26.6724 147.361 26.9454C146.505 27.2002 145.668 27.3276 144.849 27.3276Z" fill="white"/><path d="M155.871 27L151.312 13.4589H155.352L157.099 19.8472C157.281 20.5206 157.454 21.2031 157.618 21.8947C157.8 22.5864 157.982 23.2962 158.164 24.0242H158.273C158.437 23.2962 158.61 22.5864 158.792 21.8947C158.974 21.2031 159.147 20.5206 159.311 19.8472L161.085 13.4589H164.935L160.512 27H155.871Z" fill="white"/><path d="M171.668 16.2435V13.4043H184.226V16.2435H171.668ZM171.668 22.5773V19.738H184.226V22.5773H171.668Z" fill="#96D700"/><path d="M192.731 27V9.19997H198.846C200.156 9.19997 201.34 9.38197 202.395 9.74598C203.469 10.0918 204.324 10.6833 204.961 11.5205C205.598 12.3577 205.917 13.4953 205.917 14.9331C205.917 16.3163 205.598 17.4538 204.961 18.3457C204.324 19.2375 203.478 19.9018 202.422 20.3386C201.367 20.7572 200.211 20.9665 198.955 20.9665H196.744V27H192.731ZM196.744 17.7724H198.71C199.82 17.7724 200.639 17.5267 201.167 17.0352C201.713 16.5438 201.986 15.8431 201.986 14.9331C201.986 13.9867 201.694 13.3315 201.112 12.9675C200.53 12.5852 199.692 12.3941 198.6 12.3941H196.744V17.7724Z" fill="white"/><path d="M213.895 27.3276C212.748 27.3276 211.674 27.0546 210.673 26.5085C209.672 25.9443 208.853 25.1344 208.216 24.0788C207.597 23.005 207.288 21.7218 207.288 20.2294C207.288 18.737 207.597 17.463 208.216 16.4073C208.853 15.3335 209.672 14.5236 210.673 13.9776C211.674 13.4134 212.748 13.1313 213.895 13.1313C215.023 13.1313 216.088 13.4134 217.089 13.9776C218.09 14.5236 218.9 15.3335 219.519 16.4073C220.156 17.463 220.474 18.737 220.474 20.2294C220.474 21.7218 220.156 23.005 219.519 24.0788C218.9 25.1344 218.09 25.9443 217.089 26.5085C216.088 27.0546 215.023 27.3276 213.895 27.3276ZM213.895 24.0788C214.441 24.0788 214.896 23.9241 215.26 23.6147C215.642 23.3053 215.924 22.8594 216.106 22.277C216.288 21.6945 216.379 21.012 216.379 20.2294C216.379 19.4468 216.288 18.7643 216.106 18.1819C215.924 17.5995 215.642 17.1535 215.26 16.8441C214.896 16.5347 214.441 16.38 213.895 16.38C213.33 16.38 212.866 16.5347 212.502 16.8441C212.138 17.1535 211.865 17.5995 211.683 18.1819C211.501 18.7643 211.41 19.4468 211.41 20.2294C211.41 21.012 211.501 21.6945 211.683 22.277C211.865 22.8594 212.138 23.3053 212.502 23.6147C212.866 23.9241 213.33 24.0788 213.895 24.0788Z" fill="white"/><path d="M226.908 27.3003C225.998 27.3003 225.27 27.1183 224.724 26.7543C224.197 26.372 223.814 25.8442 223.578 25.1708C223.341 24.4792 223.223 23.6784 223.223 22.7684V7.88954H227.236V22.9322C227.236 23.369 227.309 23.6693 227.455 23.8331C227.618 23.9787 227.791 24.0515 227.973 24.0515C228.046 24.0515 228.11 24.0515 228.164 24.0515C228.237 24.0333 228.328 24.0151 228.437 23.9969L228.929 26.9727C228.71 27.0637 228.428 27.1365 228.082 27.1911C227.755 27.2639 227.363 27.3003 226.908 27.3003Z" fill="white"/><path d="M232.536 32.2963C232.136 32.2963 231.781 32.269 231.471 32.2144C231.18 32.1598 230.898 32.0779 230.625 31.9687L231.335 29.0202C231.535 29.0748 231.699 29.1021 231.826 29.1021C231.972 29.1203 232.108 29.1294 232.236 29.1294C232.909 29.1294 233.428 28.9565 233.792 28.6107C234.174 28.2831 234.447 27.8645 234.611 27.3549L234.802 26.6451L229.588 13.4589H233.628L235.566 19.2739C235.767 19.8927 235.949 20.5206 236.112 21.1576C236.276 21.7946 236.449 22.4499 236.631 23.1233H236.74C236.886 22.4863 237.032 21.8492 237.177 21.2122C237.341 20.557 237.505 19.9109 237.669 19.2739L239.307 13.4589H243.156L238.46 27.1365C238.023 28.2649 237.55 29.2113 237.041 29.9757C236.549 30.7401 235.94 31.3135 235.211 31.6957C234.502 32.0961 233.61 32.2963 232.536 32.2963Z" fill="white"/><path d="M250.486 27.3003C248.811 27.3003 247.61 26.818 246.882 25.8533C246.154 24.8705 245.79 23.6056 245.79 22.0585V16.5984H243.961V13.6227L246.036 13.4589L246.5 9.30917H249.831V13.4589H253.079V16.5984H249.831V22.0039C249.831 22.7684 249.985 23.3235 250.295 23.6693C250.622 23.9969 251.05 24.1607 251.578 24.1607C251.796 24.1607 252.015 24.1425 252.233 24.1061C252.451 24.0697 252.661 24.0151 252.861 23.9423L253.516 26.7543C253.17 26.8999 252.734 27.0273 252.206 27.1365C251.696 27.2457 251.123 27.3003 250.486 27.3003Z" fill="white"/><path d="M261.155 27.3276C259.299 27.3276 257.797 26.554 256.651 25.007C255.522 23.46 254.958 21.2122 254.958 18.2638C254.958 15.2971 255.522 13.0676 256.651 11.5751C257.797 10.0827 259.299 9.33647 261.155 9.33647C263.012 9.33647 264.504 10.0918 265.632 11.6024C266.779 13.0949 267.352 15.3153 267.352 18.2638C267.352 21.2122 266.779 23.46 265.632 25.007C264.504 26.554 263.012 27.3276 261.155 27.3276ZM261.155 24.2153C261.61 24.2153 262.02 24.0515 262.384 23.7239C262.748 23.3781 263.03 22.7775 263.23 21.922C263.448 21.0484 263.558 19.829 263.558 18.2638C263.558 16.6803 263.448 15.47 263.23 14.6328C263.03 13.7956 262.748 13.2223 262.384 12.9129C262.02 12.6034 261.61 12.4487 261.155 12.4487C260.7 12.4487 260.291 12.6034 259.927 12.9129C259.563 13.2223 259.271 13.7956 259.053 14.6328C258.853 15.47 258.753 16.6803 258.753 18.2638C258.753 19.829 258.853 21.0484 259.053 21.922C259.271 22.7775 259.563 23.3781 259.927 23.7239C260.291 24.0515 260.7 24.2153 261.155 24.2153Z" fill="white"/><path d="M270.146 27V7.86224H274.104V18.7825H274.214L278.418 13.4589H282.813L278.118 19.0828L283.168 27H278.827L275.77 21.7309L274.104 23.6147V27H270.146Z" fill="white"/><path d="M290.39 27.3276C289.098 27.3276 287.933 27.0455 286.896 26.4812C285.858 25.917 285.039 25.1071 284.439 24.0515C283.838 22.9959 283.538 21.7218 283.538 20.2294C283.538 18.7552 283.838 17.4902 284.439 16.4346C285.057 15.379 285.858 14.5691 286.841 14.0049C287.824 13.4225 288.852 13.1313 289.926 13.1313C291.218 13.1313 292.292 13.4225 293.147 14.0049C294.003 14.5691 294.64 15.3426 295.058 16.3254C295.477 17.3082 295.686 18.4094 295.686 19.6288C295.686 19.9746 295.668 20.3204 295.632 20.6662C295.595 20.9938 295.559 21.2577 295.523 21.4579H286.65L286.595 18.6733H292.246C292.246 17.9635 292.074 17.381 291.728 16.926C291.382 16.4528 290.809 16.2162 290.008 16.2162C289.571 16.2162 289.143 16.3345 288.725 16.5711C288.306 16.8077 287.96 17.2172 287.687 17.7997C287.414 18.3821 287.287 19.192 287.305 20.2294C287.323 21.2486 287.505 22.0494 287.851 22.6319C288.215 23.2143 288.67 23.6329 289.216 23.8877C289.762 24.1243 290.335 24.2426 290.936 24.2426C291.464 24.2426 291.964 24.1698 292.438 24.0242C292.929 23.8604 293.411 23.642 293.885 23.369L295.195 25.826C294.522 26.2992 293.757 26.6724 292.902 26.9454C292.046 27.2002 291.209 27.3276 290.39 27.3276Z" fill="white"/><path d="M298.46 27V13.4589H301.736L302.009 15.1788H302.118C302.682 14.6146 303.319 14.1323 304.029 13.7319C304.739 13.3315 305.549 13.1313 306.459 13.1313C307.951 13.1313 309.025 13.6227 309.68 14.6055C310.335 15.5701 310.663 16.8987 310.663 18.5914V27H306.65V19.1101C306.65 18.1273 306.513 17.4538 306.24 17.0898C305.985 16.7258 305.567 16.5438 304.984 16.5438C304.475 16.5438 304.038 16.6621 303.674 16.8987C303.31 17.1171 302.91 17.4356 302.473 17.8543V27H298.46Z" fill="white"/><path d="M327.388 10.5051C327.388 4.78846 323.059 0.156621 317.711 0.156621H311.848V5.49443H316.597C319.802 5.49443 321.834 8.27526 321.834 11.7018V15.2316L324.705 18.0297L321.834 20.8277V24.3576C321.834 27.7841 319.802 30.5649 316.597 30.5649H311.848V35.9027H317.711C323.051 35.9027 327.388 31.2709 327.388 25.5543V23.1609L328.87 21.6112V14.431L327.388 12.8813V10.4879V10.5051Z" fill="#96D700"/></svg>'
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    var colorPicker = document.getElementById("colorPicker");
    var colorInput = document.getElementById("colorInput");
    var colorPreviewBg = document.getElementById("colorPreviewBg");
    var randomBtn = document.getElementById("randomBtn");

    var importBtn = document.getElementById("importBtn");
    var tokenTabs = document.getElementById("tokenTabs");
    var tokenPreview = document.getElementById("tokenPreview");

    // Dashboard Elements
    var dashboardColorPicker = document.getElementById("dashboardColorPicker");
    var dashboardColorValue = document.getElementById("dashboardColorValue");
    var dashboardColorPreviewBg = document.getElementById("dashboardColorPreviewBg");
    var libraryNameDisplay = document.getElementById("libraryNameDisplay");

    // Dev Mode Elements
    var modeDesigner = document.getElementById("modeDesigner");
    var modeDev = document.getElementById("modeDev");
    var designerView = document.getElementById("designerView");
    var devView = document.getElementById("devView");
    var exportFormatTabs = document.getElementById("exportFormatTabs");
    var currentExportFormat = "css"; // Format par défaut
    var exportFlatStructure = document.getElementById("exportFlatStructure");

    // exportOutput is removed, using codeEditor and rawExportContent
    // copyBtn removed, replaced by copyBtnFooter
    var copyBtnFooter = document.getElementById("copyBtnFooter");
    var backToHomeBtn = document.getElementById("backToHomeBtn");

    var footerDesignerOps = document.getElementById("footerDesignerOps");
    var footerDevOps = document.getElementById("footerDevOps");

    // Overwrite Checkbox
    var overwriteCheckboxContainer = document.getElementById("overwriteCheckboxContainer");
    var overwriteCheckbox = document.getElementById("overwriteCheckbox");

    // Wizard Steps
    var wizardStep0 = document.getElementById("wizardStep0");
    var wizardStep1 = document.getElementById("wizardStep1");
    var wizardStep2 = document.getElementById("wizardStep2");
    var wizardStep3 = document.getElementById("wizardStep3");
    var wizardStep4 = document.getElementById("wizardStep4");

    // Vue 0 Elements
    var choiceNewSystem = document.getElementById("choiceNewSystem");
    var choiceImportFile = document.getElementById("choiceImportFile");
    var choiceManageTokens = document.getElementById("choiceManageTokens");
    var choiceVerifyFrames = document.getElementById("choiceVerifyFrames");
    var choiceExportTokens = document.getElementById("choiceExportTokens");
    var existingTokensInfo = document.getElementById("existingTokensInfo");
    var existingTokensCount = document.getElementById("existingTokensCount");
    var realFileInput = document.getElementById("realFileInput");

    // Mode Toggle
    var modeToggle = document.getElementById("modeToggle");

    // Vue 1 Elements
    var libraryOptions = document.querySelectorAll(".library-option");
    var step1Back = document.getElementById("step1Back");
    var step1Next = document.getElementById("step1Next");

    // Vue 2 Elements
    var step2Back = document.getElementById("step2Back");
    var step2Generate = document.getElementById("step2Generate");
    var themeModeSelector = document.getElementById("themeModeSelector");
    var currentThemeMode = "light";

    // Vue 3 Elements
    var backToLibBtn = document.getElementById("backToLibBtn");

    // Vue 4 Elements
    var scanBtn = document.getElementById("scanBtn");
    var scanResults = document.getElementById("scanResults");
    var scanEmptyState = document.getElementById("scanEmptyState");
    var scanResultsList = document.getElementById("unifiedCleaningList");
    var step4Back = document.getElementById("step4Back");
    var step4ApplyAll = document.getElementById("step4ApplyAll");

    // ============================================
    // STATE VARIABLES
    // ============================================
    var hasExistingTokens = false;
    var existingTokensData = null;
    var existingLibrary = null;
    var ignoredCardSignatures = []; // Signatures des cartes ignorées (persistent entre onglets)
    var ignoredResultIndices = []; // Indices des résultats ignorés (persistent définitivement)
    var appliedResultIndices = []; // Indices des résultats appliqués (peuvent être restaurés par undo)

    // ============================================
    // WIZARD NAVIGATION
    // ============================================
    function switchStep(stepNumber) {
      // Hide all steps
      wizardStep0.classList.remove("active");
      wizardStep1.classList.remove("active");
      wizardStep2.classList.remove("active");
      wizardStep3.classList.remove("active");
      wizardStep4.classList.remove("active");

      // Show the target step
      currentStep = stepNumber;

      if (stepNumber === 0) {
        wizardStep0.classList.add("active");
        // Masquer le toggle sur Vue 0
        modeToggle.classList.add("hidden");
      } else if (stepNumber === 1) {
        wizardStep1.classList.add("active");
        // Masquer le toggle sur Vue 1
        modeToggle.classList.add("hidden");
      } else if (stepNumber === 2) {
        wizardStep2.classList.add("active");
        // Masquer le toggle sur Vue 2
        modeToggle.classList.add("hidden");

        // FIX: Force sync inputs with state
        if (colorPicker && colorInput) {
          colorPicker.value = currentColor;
          colorInput.value = currentColor;
          updateColorPreview(currentColor);
        }

        // ✨ Initialiser l'aperçu accessibilité RGAA
        updateA11yPreview(currentColor);
        // ✨ Initialiser l'aperçu des tokens
        updateTokenPreview(currentColor);
      } else if (stepNumber === 3) {
        wizardStep3.classList.add("active");
        // Afficher le toggle sur Vue 3
        modeToggle.classList.remove("hidden");

        // Init Dashboard Header
        if (dashboardColorPicker) {
          dashboardColorPicker.value = currentColor;
          dashboardColorValue.textContent = currentColor;
          dashboardColorPreviewBg.style.backgroundColor = currentColor;
        }
        if (libraryNameDisplay) {
          var displayMap = {
            "tailwind": "Tailwind",
            "mui": "Material UI",
            "ant": "Ant Design",
            "bootstrap": "Bootstrap",
            "chakra": "Chakra UI",
            "custom": "Custom"
          };
          libraryNameDisplay.textContent = displayMap[currentNaming] || currentNaming || "Custom";
        }

        // Initialiser l'affichage des tokens
        if (currentTokens && typeof updatePreview === 'function') {
          // Activer l'onglet brand par défaut
          var brandTab = tokenTabs.querySelector('.tab[data-category="brand"]');
          if (brandTab) {
            tokenTabs.querySelectorAll('.tab').forEach(function (tab) { tab.classList.remove('active'); });
            brandTab.classList.add('active');
            activeCategory = 'brand';
          }
          updatePreview();
        }
      } else if (stepNumber === 4) {
        wizardStep4.classList.add("active");
        // Masquer le toggle sur Vue 4
        modeToggle.classList.add("hidden");

        // Init scan state
        updateScanUI();

        // Force selection check
        parent.postMessage({ pluginMessage: { type: 'check-selection' } }, '*');
      }
    }

    function resetWizard() {
      currentColor = "#6366F1";
      currentNaming = "";
      currentTokens = null;
      selectedFile = null;
      activeCategory = "brand";

      // Reset library selection
      libraryOptions.forEach(function (opt) {
        opt.classList.remove("selected");
      });
      step1Next.disabled = true;

      // Reset color
      colorInput.value = currentColor;
      colorPicker.value = currentColor;
      updateColorPreview(currentColor);

      // Reset scan results
      var scanResults = document.getElementById("scanResults");
      var scanEmptyState = document.getElementById("scanEmptyState");
      if (scanResults) scanResults.classList.add("hidden");
      if (scanEmptyState) scanEmptyState.classList.remove("hidden");

      // Go back to step 0
      switchStep(0);
    }

    // ============================================
    // ACCESSIBILITÉ RGAA - Calcul et Vérification
    // ============================================

    var a11yIssues = []; // Stockage des problèmes détectés
    var a11yFixes = {}; // Corrections sélectionnées {tokenKey: newValue}
    var lastA11yColor = null; // ✨ Tracking de la dernière couleur vérifiée (pour synchronisation)

    // Calcul du ratio de contraste WCAG
    function calculateContrastRatio(foreground, background) {
      function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      }

      function getLuminance(rgb) {
        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;

        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }

      const rgb1 = hexToRgb(foreground);
      const rgb2 = hexToRgb(background);

      const lum1 = getLuminance(rgb1);
      const lum2 = getLuminance(rgb2);

      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);

      return (lighter + 0.05) / (darker + 0.05);
    }

    // ============================================
    // HELPERS - Détection et Manipulation de Couleurs
    // ============================================

    // Déterminer si une couleur est claire ou foncée
    function isColorLight(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return true;

      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);

      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5;
    }

    // ✨ Déterminer intelligemment si une couleur doit avoir du texte blanc ou noir
    // Basé sur le contraste réel, pas sur un seuil arbitraire
    function shouldUseWhiteText(backgroundColor) {
      const contrastWithWhite = calculateContrastRatio('#FFFFFF', backgroundColor);
      const contrastWithBlack = calculateContrastRatio('#000000', backgroundColor);

      console.log('🎨 shouldUseWhiteText pour', backgroundColor);
      console.log('  Contraste avec blanc:', contrastWithWhite.toFixed(2));
      console.log('  Contraste avec noir:', contrastWithBlack.toFixed(2));

      // Si le contraste avec blanc est meilleur, utiliser texte blanc
      const useWhite = contrastWithWhite > contrastWithBlack;
      console.log('  → Utiliser texte', useWhite ? 'BLANC' : 'NOIR');

      return useWhite;
    }

    // Assombrir une couleur
    function darkenColor(hex, percent) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return hex;

      const factor = 1 - (percent / 100);
      const r = Math.max(0, Math.floor(parseInt(result[1], 16) * factor));
      const g = Math.max(0, Math.floor(parseInt(result[2], 16) * factor));
      const b = Math.max(0, Math.floor(parseInt(result[3], 16) * factor));

      return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    // Éclaircir une couleur
    function lightenColor(hex, percent) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return hex;

      const factor = percent / 100;
      const r = Math.min(255, Math.floor(parseInt(result[1], 16) + (255 - parseInt(result[1], 16)) * factor));
      const g = Math.min(255, Math.floor(parseInt(result[2], 16) + (255 - parseInt(result[2], 16)) * factor));
      const b = Math.min(255, Math.floor(parseInt(result[3], 16) + (255 - parseInt(result[3], 16)) * factor));

      return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    // Générer une palette de couleurs foncées
    function getDarkColorPalette(baseColor) {
      console.log('🎨 getDarkColorPalette pour', baseColor);

      const palette = [
        darkenColor(baseColor, 15),
        darkenColor(baseColor, 30),
        darkenColor(baseColor, 45),
        darkenColor(baseColor, 60),
        darkenColor(baseColor, 75),
        darkenColor(baseColor, 90),
        // Grays de secours (au cas où la couleur primaire ne donne pas de bons résultats)
        '#1F2937', '#374151', '#4B5563', '#6B7280', '#111827'
      ];

      // Dédupliquer
      const uniquePalette = [...new Set(palette)];
      console.log('  → Palette générée:', uniquePalette.slice(0, 6));

      return uniquePalette;
    }

    // Générer une palette de couleurs claires
    function getLightColorPalette(baseColor) {
      const palette = [
        lightenColor(baseColor, 20),
        lightenColor(baseColor, 40),
        lightenColor(baseColor, 60),
        '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6' // Grays de secours
      ];
      return [...new Set(palette)];
    }

    // Détection intelligente du type de token
    function detectTokenType(tokenKey, foreground, background) {
      // Cas 1 : Boutons primaires / Statut - DÉTECTION INTELLIGENTE
      if (tokenKey.includes('action.primary') || tokenKey.includes('status.')) {
        const useWhiteText = shouldUseWhiteText(background);

        if (useWhiteText) {
          // Le texte blanc a un bon contraste → garder texte blanc, changer fond si besoin
          return {
            type: 'button-primary-dark',
            whatToChange: 'background',
            textColor: '#FFFFFF',
            needsDarker: true
          };
        } else {
          // Le texte noir a un meilleur contraste → garder fond, changer texte
          return {
            type: 'button-primary-light',
            whatToChange: 'foreground',
            backgroundColor: background,
            needsDarker: true // Texte foncé
          };
        }
      }

      // Cas 2 : Boutons secondaires
      if (tokenKey.includes('action.secondary')) {
        const isLightText = isColorLight(foreground);
        return {
          type: 'button-secondary',
          whatToChange: isLightText ? 'background' : 'foreground',
          textColor: foreground,
          needsDarker: !isLightText
        };
      }

      // Cas 3 : Texte
      if (tokenKey.includes('text.')) {
        return {
          type: 'text',
          whatToChange: 'foreground',
          backgroundColor: background,
          needsDarker: isColorLight(background)
        };
      }

      // Cas 4 : Autres
      return {
        type: 'other',
        whatToChange: 'foreground',
        needsDarker: isColorLight(background)
      };
    }

    // Mise à jour de l'aperçu accessibilité
    function updateA11yPreview(primaryColor) {
      if (!primaryColor || !primaryColor.startsWith('#')) {
        primaryColor = currentColor || '#6366F1';
      }

      // ✨ Mémoriser la couleur vérifiée
      lastA11yColor = primaryColor;

      // Simuler les tokens critiques qui seront générés
      const previewTokens = {
        'text.primary': '#111827',    // gray.900
        'text.secondary': '#4B5563',  // gray.700
        'text.muted': '#6B7280',      // gray.600
        'bg.surface': '#FFFFFF',      // Fond blanc
        'action.primary': primaryColor
      };

      // Vérifications critiques
      const checks = [
        {
          label: 'Texte principal',
          foreground: previewTokens['text.primary'],
          background: previewTokens['bg.surface'],
          minRatio: 4.5,
          tokenKey: 'text.primary'
        },
        {
          label: 'Boutons primaires',
          foreground: shouldUseWhiteText(primaryColor) ? '#FFFFFF' : '#111827', // ✨ Détection intelligente
          background: primaryColor,
          minRatio: 4.5,
          tokenKey: 'action.primary.contrastText'
        },
        {
          label: 'Texte secondaire',
          foreground: previewTokens['text.muted'],
          background: previewTokens['bg.surface'],
          minRatio: 4.5,
          tokenKey: 'text.muted'
        }
      ];

      // Générer le HTML
      let html = '';
      let compliantCount = 0;
      let warningCount = 0;
      let errorCount = 0;
      a11yIssues = []; // Reset

      checks.forEach(check => {
        const ratio = calculateContrastRatio(check.foreground, check.background);

        const level = ratio >= 7.0 ? 'AAA' :
          ratio >= 4.5 ? 'AA' :
            ratio >= 3.0 ? 'AA Large' : 'Fail';

        const icon = ratio >= 4.5 ? '✅' :
          ratio >= 3.0 ? '⚠️' : '❌';

        const cssClass = ratio >= 4.5 ? 'success' :
          ratio >= 3.0 ? 'warning' : 'error';

        // Compteurs
        if (ratio >= 4.5) {
          compliantCount++;
        } else if (ratio >= 3.0) {
          warningCount++;
          a11yIssues.push({
            ...check,
            ratio: ratio,
            level: 'AA_LARGE',
            severity: 'warning'
          });
        } else {
          errorCount++;
          a11yIssues.push({
            ...check,
            ratio: ratio,
            level: 'FAIL',
            severity: 'error'
          });
        }

        html += `
          <div class="a11y-preview-item">
            <span class="a11y-preview-label">${icon} ${check.label}</span>
            <span class="a11y-preview-value">
              <span class="a11y-ratio">${ratio.toFixed(1)}:1</span>
              <span class="a11y-level ${cssClass}">${level}</span>
            </span>
          </div>
        `;
      });

      // Mettre à jour le contenu
      const content = document.getElementById('a11yPreviewContent');
      if (content) content.innerHTML = html;

      // Mettre à jour le badge (ancien bloc RGAA - on garde pour compatibilité)
      const badge = document.getElementById('a11yBadge');
      const badgePreview = document.getElementById('a11yBadgePreview'); // ✨ Nouveau badge dans l'aperçu

      const badgeText = errorCount > 0
        ? `${errorCount} problème${errorCount > 1 ? 's' : ''}`
        : warningCount > 0
          ? `${warningCount} avertissement${warningCount > 1 ? 's' : ''}`
          : 'RGAA Conforme';

      const badgeClass = errorCount > 0 ? 'a11y-badge error'
        : warningCount > 0 ? 'a11y-badge warning'
          : 'a11y-badge success';

      if (badge) {
        badge.textContent = badgeText;
        badge.className = badgeClass;
        badge.style.display = 'inline-block';
      }

      // ✨ Mettre à jour le badge dans l'aperçu
      if (badgePreview) {
        badgePreview.textContent = badgeText;
        badgePreview.className = badgeClass;
        badgePreview.style.display = 'inline-block';
      }

      // ✨ Afficher/masquer le bouton détails
      const detailsBtn = document.getElementById('a11yDetailsBtn');
      if (detailsBtn) {
        detailsBtn.style.display = (warningCount > 0 || errorCount > 0) ? 'block' : 'none';
      }
    }

    // Ouvrir la modale de détails
    function openA11yModal() {
      // ✨ DEBUG
      console.log('🔍 openA11yModal - lastA11yColor:', lastA11yColor, 'currentColor:', currentColor);

      // ✨ Recalculer si la couleur a changé
      if (lastA11yColor !== currentColor) {
        console.log('🔄 Couleur changée, recalcul...');
        updateA11yPreview(currentColor);
        console.log('✅ Recalcul terminé, a11yIssues:', a11yIssues.length);
      } else {
        console.log('✅ Couleur inchangée');
      }

      if (a11yIssues.length === 0) {
        alert('Aucun problème d\'accessibilité détecté !');
        return;
      }

      // Générer le contenu de la modale
      let html = `
        <div style="background: var(--poly-surface-soft); border: 1px solid var(--poly-border-subtle); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px;">📊 Résumé</h4>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: var(--poly-text-muted);">
            ${a11yIssues.length} token${a11yIssues.length > 1 ? 's' : ''} avec un contraste insuffisant pour le RGAA (≥ 4.5:1)
          </p>
          <p style="margin: 0; font-size: 11px; color: var(--poly-text-muted);">
            Couleur primaire : <span style="font-family: monospace; color: var(--poly-accent); font-weight: 600;">${currentColor}</span>
          </p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
      `;

      a11yIssues.forEach((issue, index) => {
        const suggestions = generateA11ySuggestions(issue);
        const icon = issue.severity === 'error' ? '❌' : '⚠️';

        // Déterminer le type d'aperçu (bouton ou texte)
        const isButton = issue.tokenKey.includes('action') || issue.tokenKey.includes('button');

        html += `
          <div style="background: var(--poly-surface-soft); border: 1px solid var(--poly-border-subtle); border-radius: 8px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <strong style="font-size: 13px;">${icon} ${issue.label}</strong>
              <span style="font-size: 11px; color: var(--poly-text-muted);">${issue.tokenKey}</span>
            </div>
            
            <div style="background: var(--poly-surface); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                <span style="color: var(--poly-text-muted);">Actuel :</span>
                <span style="font-family: monospace;">${issue.foreground}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                <span style="color: var(--poly-text-muted);">Fond :</span>
                <span style="font-family: monospace;">${issue.background}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px;">
                <span style="color: var(--poly-text-muted);">Contraste :</span>
                <span style="color: ${issue.severity === 'error' ? '#EF4444' : '#F59E0B'}; font-weight: 600;">
                  ${issue.ratio.toFixed(1)}:1 ${issue.level === 'FAIL' ? '❌' : '⚠️'}
                </span>
              </div>
              
              <!-- Aperçu visuel -->
              <div style="margin-top: 12px;">
                <div style="font-size: 11px; color: var(--poly-text-muted); margin-bottom: 6px;">Aperçu :</div>
                ${isButton ? `
                  <div style="display: inline-block; padding: 10px 20px; background: ${issue.background}; color: ${issue.foreground}; border-radius: 6px; font-size: 13px; font-weight: 500; border: 1px solid rgba(255,255,255,0.1);">
                    Button Text
                  </div>
                ` : `
                  <div style="padding: 12px; background: ${issue.background}; color: ${issue.foreground}; border-radius: 6px; font-size: 13px; line-height: 1.5; border: 1px solid var(--poly-border-subtle);">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </div>
                `}
              </div>
            </div>
          </div>
        `;
      });

      html += '</div>';

      // Injecter le contenu
      document.getElementById('a11yModalContent').innerHTML = html;

      // Afficher la modale
      document.getElementById('a11yModal').classList.add('active');
    }


    function closeA11yModal() {
      document.getElementById('a11yModal').classList.remove('active');
    }

    // Générer des suggestions de correction (VERSION INTELLIGENTE)
    function generateA11ySuggestions(issue) {
      const suggestions = [];

      // ✨ Détection intelligente du type de token
      const tokenType = detectTokenType(issue.tokenKey, issue.foreground, issue.background);

      console.log('🎨 generateA11ySuggestions pour', issue.tokenKey, '- Type:', tokenType.type, '- Change:', tokenType.whatToChange);

      if (tokenType.whatToChange === 'background') {
        // ========================================
        // CAS 1 : On doit changer le FOND (boutons)
        // ========================================
        const textColor = tokenType.textColor || '#FFFFFF';

        // Générer des variantes plus foncées de la couleur primaire
        const darkVariants = getDarkColorPalette(issue.background);

        darkVariants.forEach(color => {
          const ratio = calculateContrastRatio(textColor, color);
          if (ratio >= 4.5 && color !== issue.background) {
            suggestions.push({
              value: color,
              ratio: ratio,
              level: ratio >= 7.0 ? 'AAA' : 'AA',
              type: 'background'
            });
          }
        });

        console.log('  → Suggestions trouvées:', suggestions.length, suggestions.map(s => s.value));

        // Si pas assez de suggestions, ajouter des couleurs génériques foncées
        if (suggestions.length < 3) {
          console.log('  ⚠️ Pas assez, ajout de fallbacks...');
          const fallbackColors = ['#1F2937', '#374151', '#4B5563', '#6B7280', '#1E40AF', '#166534'];
          fallbackColors.forEach(color => {
            const ratio = calculateContrastRatio(textColor, color);
            if (ratio >= 4.5 && !suggestions.find(s => s.value === color)) {
              suggestions.push({
                value: color,
                ratio: ratio,
                level: ratio >= 7.0 ? 'AAA' : 'AA',
                type: 'background'
              });
            }
          });
        }

      } else {
        // ========================================
        // CAS 2 : On doit changer le TEXTE
        // ========================================
        const bgColor = tokenType.backgroundColor || issue.background;
        const isLightBg = isColorLight(bgColor);

        if (isLightBg) {
          // Fond clair → chercher des textes foncés
          const darkGrays = ['#111827', '#1F2937', '#374151', '#4B5563', '#6B7280'];
          darkGrays.forEach(color => {
            const ratio = calculateContrastRatio(color, bgColor);
            if (ratio >= 4.5 && color !== issue.foreground) {
              suggestions.push({
                value: color,
                ratio: ratio,
                level: ratio >= 7.0 ? 'AAA' : 'AA',
                type: 'foreground'
              });
            }
          });
        } else {
          // Fond foncé → chercher des textes clairs
          const lightGrays = ['#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF'];
          lightGrays.forEach(color => {
            const ratio = calculateContrastRatio(color, bgColor);
            if (ratio >= 4.5 && color !== issue.foreground) {
              suggestions.push({
                value: color,
                ratio: ratio,
                level: ratio >= 7.0 ? 'AAA' : 'AA',
                type: 'foreground'
              });
            }
          });
        }
      }

      // Trier par ratio de contraste (du meilleur au moins bon)
      suggestions.sort((a, b) => b.ratio - a.ratio);

      // Edge case : Aucune suggestion trouvée
      if (suggestions.length === 0) {
        console.warn('⚠️ Aucune suggestion trouvée pour', issue.tokenKey);
        // Retourner une suggestion par défaut
        return [{
          value: tokenType.whatToChange === 'background' ? '#1F2937' : '#111827',
          ratio: 10.0,
          level: 'AAA',
          type: tokenType.whatToChange,
          fallback: true
        }];
      }

      return suggestions.slice(0, 3); // Top 3
    }


    // Appliquer les corrections
    function applyA11yFixes() {
      if (Object.keys(a11yFixes).length === 0) {
        alert('Aucune correction sélectionnée');
        return;
      }

      console.log('🔧 Application des corrections RGAA:', a11yFixes);

      // Envoyer au plugin pour régénération
      parent.postMessage({
        pluginMessage: {
          type: 'apply-a11y-fixes',
          fixes: a11yFixes,
          primaryColor: currentColor,
          library: currentNaming
        }
      }, '*');

      closeA11yModal();

      // Afficher un message de confirmation
      alert(`✅ ${Object.keys(a11yFixes).length} correction(s) appliquée(s) ! Les tokens vont être régénérés.`);
    }

    // ============================================
    // VUE 0: ACCUEIL - Event Listeners
    // ============================================


    choiceNewSystem.addEventListener("click", function () {
      switchStep(1); // Go directly to library selection
    });

    choiceImportFile.addEventListener("click", function () {
      realFileInput.click(); // Open file picker directly
    });

    choiceManageTokens.addEventListener("click", function () {
      if (hasExistingTokens && existingTokensData) {
        currentTokens = existingTokensData;
        // Aller directement à l'étape des résultats
        updatePreview();
        updateExport();
        switchStep(3);
      }
    });

    choiceVerifyFrames.addEventListener("click", function () {
      switchStep(4); // Go directly to frame verification
    });

    choiceExportTokens.addEventListener("click", function () {
      // Si on a des tokens existants, aller directement à l'export
      if (hasExistingTokens && existingTokensData) {
        currentTokens = existingTokensData;
        // Aller à l'étape des résultats
        updatePreview();
        updateExport();
        // Forcer le mode développeur avant d'afficher l'étape
        modeDev.click();
        switchStep(3);
      } else {
        // Pas de tokens existants, créer un système par défaut d'abord
        switchStep(1);
      }
    });


    realFileInput.addEventListener("change", function (e) {
      selectedFile = e.target.files[0];
      if (selectedFile) {
        // Parse file and go directly to step 3
        var reader = new FileReader();
        reader.onload = function (event) {
          var content = event.target.result;
          var ext = selectedFile.name.split(".").pop().toLowerCase();
          var tokensFromFile = null;

          try {
            if (ext === "json") {
              tokensFromFile = JSON.parse(content);
            } else if (ext === "css") {
              tokensFromFile = parseCssToTokens(content);
            }

            if (tokensFromFile) {
              // Send explicit import message


              currentTokens = tokensFromFile;
              updatePreview();
              updateExport();
              switchStep(3);

              // Petit feedback visuel optionnel pour dire que le fichier est chargé
              // (Pas figma.notify car le plugin ne sait rien pour l'instant)
            }
          } catch (err) {
            alert("Error parsing file: " + err.message);
          }
        };
        reader.readAsText(selectedFile);
      }
    });

    // ============================================
    // EASTER EGG - URLs de design inspiration
    // ============================================
    const easterEggUrls = [
      // À définir plus tard par l'utilisateur
      'https://dribbble.com/tags/design-system',
      'https://www.awwwards.com/',
      'https://coolors.co/',
      'https://designsystemsrepo.com/design-systems',
      'https://www.refactoringui.com/',
      'https://m3.material.io/'
    ];
    let easterEggIndex = 0; // Index de rotation

    // ============================================
    // VUE 1: LIBRAIRIE - Event Listeners
    // ============================================
    libraryOptions.forEach(function (option) {
      option.addEventListener("click", function () {
        // Remove selected from all
        libraryOptions.forEach(function (opt) {
          opt.classList.remove("selected");
        });

        // Add selected to clicked
        option.classList.add("selected");
        var selectedNaming = option.getAttribute("data-library");
        currentNaming = selectedNaming;

        // Save naming preference immediately
        parent.postMessage({
          pluginMessage: {
            type: 'save-naming',
            naming: selectedNaming
          }
        }, '*');

        // Enable next button
        step1Next.disabled = false;
      });
    });

    step1Back.addEventListener("click", function () {
      switchStep(0); // Back to home
    });

    step1Next.addEventListener("click", function () {
      switchStep(2); // Go to color selection
    });

    // ============================================
    // VUE 2: COULEUR - Event Listeners
    // ============================================
    function updateColorPreview(color) {
      colorPreviewBg.style.backgroundColor = color;
    }

    // ============================================
    // MISE À JOUR DE L'APERÇU VISUEL DES TOKENS
    // ============================================
    // MISE À JOUR DE L'APERÇU VISUEL DES TOKENS (VERSION COMPLÈTE)
    // ============================================

    function updateTokenPreview(primaryColor) {
      if (!primaryColor || !primaryColor.startsWith('#')) {
        primaryColor = currentColor || '#6366F1';
      }

      // Déterminer le mode actuel (Light/Dark/Both)
      const checkedMode = document.querySelector('input[name="themeMode"]:checked');
      let currentMode = checkedMode ? checkedMode.value : 'light'; // Par défaut light

      // Afficher/masquer les cards selon le mode
      const cardLight = document.getElementById('previewCardLight');
      const cardDark = document.getElementById('previewCardDark');

      if (currentMode === 'both') {
        if (cardLight) cardLight.style.display = 'block';
        if (cardDark) cardDark.style.display = 'block';
      } else if (currentMode === 'dark') {
        if (cardLight) cardLight.style.display = 'none';
        if (cardDark) cardDark.style.display = 'block';
      } else {
        if (cardLight) cardLight.style.display = 'block';
        if (cardDark) cardDark.style.display = 'none';
      }

      // ============================================
      // CALCULER LES TOKENS
      // ============================================

      const useWhiteText = shouldUseWhiteText(primaryColor);
      const btnPrimaryText = useWhiteText ? '#FFFFFF' : '#111827';
      const btnPrimaryHover = darkenColor(primaryColor, 10);

      // ============================================
      // METTRE À JOUR CARD LIGHT
      // ============================================

      // Image (bg.elevated)
      const imgLight = document.getElementById('previewImageLight');
      if (imgLight) {
        imgLight.style.background = lightenColor(primaryColor, 85); // Très clair
      }



      // Bouton Primary
      const btnPrimaryLight = document.getElementById('previewBtnPrimaryLight');
      if (btnPrimaryLight) {
        btnPrimaryLight.style.background = primaryColor;
        btnPrimaryLight.style.color = btnPrimaryText;

        btnPrimaryLight.onmouseover = function () {
          this.style.background = btnPrimaryHover; // Token: action.primary.hover
        };
        btnPrimaryLight.onmouseout = function () {
          this.style.background = primaryColor; // Token: action.primary.default
        };

        // 🎨 Easter Egg - Rotation des URLs à chaque clic
        btnPrimaryLight.onclick = function () {
          window.open(easterEggUrls[easterEggIndex], '_blank');
          easterEggIndex = (easterEggIndex + 1) % easterEggUrls.length;
        };
      }



      // ============================================
      // METTRE À JOUR CARD DARK
      // ============================================

      // Card background (bg.surface dark) - Réutilise la variable déclarée plus haut
      if (cardDark) {
        cardDark.style.background = darkenColor(primaryColor, 90); // Très très foncé
      }

      // Image (bg.elevated)
      const imgDark = document.getElementById('previewImageDark');
      if (imgDark) {
        imgDark.style.background = darkenColor(primaryColor, 70); // Très foncé
      }



      // Bouton Primary
      const btnPrimaryDark = document.getElementById('previewBtnPrimaryDark');
      if (btnPrimaryDark) {
        btnPrimaryDark.style.background = primaryColor;
        btnPrimaryDark.style.color = btnPrimaryText;

        btnPrimaryDark.onmouseover = function () {
          this.style.background = btnPrimaryHover; // Token: action.primary.hover
        };
        btnPrimaryDark.onmouseout = function () {
          this.style.background = primaryColor; // Token: action.primary.default
        };

        // 🎨 Easter Egg - Rotation des URLs à chaque clic
        btnPrimaryDark.onclick = function () {
          window.open(easterEggUrls[easterEggIndex], '_blank');
          easterEggIndex = (easterEggIndex + 1) % easterEggUrls.length;
        };
      }

    }

    colorPicker.addEventListener("input", function () {
      currentColor = colorPicker.value.toUpperCase();
      colorInput.value = currentColor;
      updateColorPreview(currentColor);
      updateA11yPreview(currentColor); // ✨ Mise à jour aperçu RGAA
      updateTokenPreview(currentColor); // ✨ Mise à jour aperçu tokens
    });

    colorInput.addEventListener("input", function () {
      currentColor = colorInput.value.toUpperCase();
      colorPicker.value = currentColor;
      updateColorPreview(currentColor);
      updateA11yPreview(currentColor); // ✨ Mise à jour aperçu RGAA
      updateTokenPreview(currentColor); // ✨ Mise à jour aperçu tokens
    });

    randomBtn.addEventListener("click", function () {
      var randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0").toUpperCase();
      currentColor = randomColor;
      colorInput.value = randomColor;
      colorPicker.value = randomColor;
      updateColorPreview(randomColor);
      updateA11yPreview(randomColor); // ✨ Mise à jour aperçu RGAA
      updateTokenPreview(randomColor); // ✨ Mise à jour aperçu tokens
    });

    // ✨ Event listeners pour les changements de mode (Light/Dark/Both)
    const themeModeRadios = document.querySelectorAll('input[name="themeMode"]');
    themeModeRadios.forEach(radio => {
      radio.addEventListener('change', function () {
        updateTokenPreview(currentColor); // Mettre à jour l'aperçu selon le nouveau mode
      });
    });

    // Event listener pour le bouton "Voir les détails"
    var a11yDetailsBtn = document.getElementById('a11yDetailsBtn');
    if (a11yDetailsBtn) {
      a11yDetailsBtn.addEventListener('click', function () {
        openA11yModal();
      });
    }

    step2Back.addEventListener("click", function () {
      // Si on a des tokens existants, revenir à l'accueil au lieu de la sélection de librairie
      if (hasExistingTokens) {
        switchStep(0);
      } else {
        switchStep(1); // Back to library selection
      }
    });


    // ✨ Event listeners pour TOUS les radio buttons du theme mode (anciens + nouveaux)
    document.querySelectorAll('input[name="themeMode"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        // Mettre à jour les classes active sur TOUS les radio buttons themeMode
        document.querySelectorAll('input[name="themeMode"]').forEach(function (r) {
          if (r.parentElement) {
            r.parentElement.classList.remove('active');
          }
        });

        // Ajouter active sur tous les boutons avec la même valeur
        document.querySelectorAll(`input[name="themeMode"][value="${radio.value}"]`).forEach(function (r) {
          if (r.parentElement) {
            r.parentElement.classList.add('active');
          }
        });

        // Mettre à jour le theme mode
        currentThemeMode = radio.value;
        console.log('🌓 Theme Mode switched to:', currentThemeMode);

        // Sauvegarder immédiatement
        parent.postMessage({
          pluginMessage: {
            type: 'save-theme-mode',
            themeMode: currentThemeMode
          }
        }, '*');
      });
    });

    step2Generate.addEventListener("click", function () {
      // Send message to plugin to generate tokens
      parent.postMessage({
        pluginMessage: {
          type: "generate",
          color: currentColor,
          naming: currentNaming,
          themeMode: currentThemeMode
        }
      }, "*");
    });

    // ============================================
    // VUE 3: RÉSULTAT - Event Listeners
    // ============================================

    // Dashboard Color Picker Logic
    if (dashboardColorPicker) {
      dashboardColorPicker.addEventListener("input", function () {
        var val = dashboardColorPicker.value.toUpperCase();
        dashboardColorValue.textContent = val;
        dashboardColorPreviewBg.style.backgroundColor = val;
      });

      dashboardColorPicker.addEventListener("change", function () {
        var val = dashboardColorPicker.value.toUpperCase();
        currentColor = val;

        // Regenerate
        parent.postMessage({
          pluginMessage: {
            type: "generate",
            color: currentColor,
            naming: currentNaming,
            themeMode: currentThemeMode
          }
        }, "*");
      });
    }

    backToLibBtn.addEventListener("click", function () {
      // Si on a des tokens existants, revenir à l'accueil au lieu de la sélection de librairie
      if (hasExistingTokens) {
        switchStep(0);
      } else {
        // Reset library selection
        libraryOptions.forEach(function (opt) {
          opt.classList.remove("selected");
        });
        currentNaming = "";
        step1Next.disabled = true;
        switchStep(1); // Back to library selection
      }
    });

    importBtn.addEventListener("click", function () {
      // 1. État de chargement IMMÉDIAT
      var originalText = this.innerHTML;
      this.classList.add('btn-loading');
      this.disabled = true;
      this.innerHTML = '<div class="loading-spinner"></div> Import en cours...';

      var shouldOverwrite = overwriteCheckbox.checked;
      parent.postMessage({
        pluginMessage: {
          type: "import",
          naming: currentNaming,
          overwrite: shouldOverwrite,
          tokens: currentTokens
        }
      }, "*");

      // 2. Écouter la réponse
      var feedbackListener = function (event) {
        var msg = event.data.pluginMessage;
        if (msg && msg.type === 'import-completed') {
          importBtn.classList.remove('btn-loading');
          importBtn.disabled = false;
          importBtn.innerHTML = '✨ Terminée !'; // Feedback positif immédiat
          setTimeout(function () { importBtn.innerHTML = originalText; }, 2000);
          window.removeEventListener('message', feedbackListener);
        }
      };
      window.addEventListener('message', feedbackListener);
    });


    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    function detectPrimaryColorFromTokens(brandTokens) {
      if (!brandTokens) return null;

      // Common keys for the base color depending on library
      var candidates = ['500', 'main', 'primary', 'base', '6'];

      for (var i = 0; i < candidates.length; i++) {
        if (brandTokens[candidates[i]]) {
          return brandTokens[candidates[i]];
        }
      }

      // Fallback: take the first available color if no standard key found
      var keys = Object.keys(brandTokens);
      if (keys.length > 0) return brandTokens[keys[0]];

      return null;
    }

    // ============================================
    // VUE 4: VÉRIFICATION DE FRAME - Event Listeners
    // ============================================

    function updateScanUI() {
      // Masquer tous les états par défaut
      var scanResults = document.getElementById("scanResults");
      var scanEmptyState = document.getElementById("scanEmptyState");
      if (scanResults) scanResults.classList.add('hidden');
      if (scanEmptyState) scanEmptyState.classList.remove('hidden'); // Afficher l'état vide par défaut

      // Vérifier si une sélection existe dans Figma
      parent.postMessage({
        pluginMessage: {
          type: "check-selection"
        }
      }, "*");
    }

    // ============================================
    // MAGIC FIX FUNCTIONS - Nouvelle UX
    // ============================================

    // Fonction pour enrichir les suggestions avec leur valeur résolue
    // Les suggestions sont maintenant déjà enrichies côté plugin avec resolvedValue
    function enrichSuggestionsWithValues(suggestions, property, currentValue) {
      return suggestions.map(function (suggestion) {
        var enriched = Object.assign({}, suggestion);
        if (!enriched.resolvedValue) {
          // Fallback : si resolvedValue n'est pas défini (anciennes données)
          // Pour les couleurs, la valeur hex est déjà dans suggestion.hex
          if (property === 'Fill' || property === 'Stroke' || property === 'Local Fill Style' || property === 'Local Stroke Style') {
            enriched.resolvedValue = suggestion.hex || currentValue;
          } else {
            // Pour les autres propriétés, on utilise la valeur actuelle comme approximation
            enriched.resolvedValue = currentValue;
          }
        }
        return enriched;
      });
    }

    function groupResultsByValue(results) {
      var groups = {};

      results.forEach(function (result, index) {
        result.originalIndex = index;

        // Déterminer une catégorie simplifiée
        var category = 'SHAPE'; // Par défaut
        if (result.nodeType === 'TEXT') category = 'TEXT';
        // Tu peux ajouter d'autres cas si nécessaire (ex: SECTION)

        // ✅ FIX: Clé unique basée sur propriété + valeur + status bounding + categorie + nodeType (Strict Separation)
        // Cela garantit que Text Fill et Shape Fill sont séparés, même si même valeur
        var isBoundStr = result.isBound ? '1' : '0';
        var boundIdStr = result.boundVariableId || '';
        var safeCategory = category || 'SHAPE'; // Fallback logic
        var groupKey = result.property + '|' + result.value + '|' + safeCategory + '|' + result.nodeType + '|' + isBoundStr + '|' + boundIdStr;

        if (!groups[groupKey]) {
          var suggestions = result.suggestions || result.colorSuggestions || result.numericSuggestions || [];
          groups[groupKey] = {
            property: result.property,
            value: result.value,
            category: category,
            nodeType: result.nodeType, // Keep for debugging
            isBound: result.isBound,
            boundVariableId: result.boundVariableId,
            originalIndices: [],
            suggestions: enrichSuggestionsWithValues(suggestions, result.property, result.value),
            layerNames: [] // Pour debug si nécessaire
          };
        }

        groups[groupKey].originalIndices.push(index);
        groups[groupKey].layerNames.push(result.layerName);

        // Fusionner les suggestions si elles diffèrent
        var suggestionsToMerge = result.suggestions || result.colorSuggestions || result.numericSuggestions;
        if (suggestionsToMerge && Array.isArray(suggestionsToMerge)) {
          suggestionsToMerge.forEach(function (suggestion) {
            var existing = groups[groupKey].suggestions.find(function (s) { return s.id === suggestion.id; });
            if (!existing) {
              var enrichedSuggestions = enrichSuggestionsWithValues([suggestion], result.property, result.value);
              groups[groupKey].suggestions.push(enrichedSuggestions[0]);
            }
          });
        }
      });

      return Object.values(groups);
    }

    // New helper functions for manual conflict handling with preview
    window.handleConflictSelectChange = function (indices, variableId, selectElement) {
      // 1. Send preview
      if (variableId) {
        // Store selected variable ID on the button's parent or accessible place
        selectElement.dataset.selectedVariable = variableId;

        // Show apply button
        var container = selectElement.parentElement; // We will wrap in a div
        var applyBtn = container.querySelector('.btn-apply-manual');
        if (applyBtn) {
          applyBtn.style.display = 'inline-block';
          // Store indices and variable on button for easy access
          applyBtn.dataset.indices = JSON.stringify(indices);
          applyBtn.dataset.variableId = variableId;
        }

        // Preview
        if (typeof sendPreviewFix === 'function') {
          sendPreviewFix(indices, variableId);
        } else {
          console.warn("sendPreviewFix not found");
        }
      } else {
        // Hide apply button if cleared
        var container = selectElement.parentElement;
        var applyBtn = container.querySelector('.btn-apply-manual');
        if (applyBtn) applyBtn.style.display = 'none';
      }
    };

    window.applyManualFix = function (btnElement) {
      var indices = JSON.parse(btnElement.dataset.indices || '[]');
      var variableId = btnElement.dataset.variableId;
      if (indices.length > 0 && variableId) {
        applyGroupFix(indices, variableId);
        // Hide button after apply (optional, or rely on re-render)
        btnElement.style.display = 'none';
        btnElement.textContent = 'Applied';
      }
    };

    function renderCompactRow(group) {
      var hasConflicts = group.suggestions.length > 1;
      var bestSuggestion = group.suggestions[0];

      // Fonction helper pour obtenir l'icône SVG selon le type de propriété
      function getPropertyIcon(property) {
        var p = (property || '').toUpperCase();
        switch (p) {
          case 'FILL':
          case 'TEXT_FILL':
            return '<span class="property-label">FILL</span>';
          case 'STROKE':
            return '<span class="property-label">Contour</span>';
          case 'STYLE LOCAL':
          case 'LOCAL_FILL_STYLE':
          case 'LOCAL_STROKE_STYLE':
            return '<span class="property-label">Style Local</span>';
          case 'RADIUS':
          case 'CORNER_RADIUS':
            return '<span class="property-label">RADIUS</span>';
          case 'GAP':
          case 'SPACING':
          case 'ITEM_SPACING':
          case 'WIDTH':
          case 'HEIGHT':
            return '<span class="property-label">Dimension</span>';
          case 'LINE_HEIGHT':
            return '<span class="property-label">Ligne</span>';
          case 'FONT_SIZE':
            return '<span class="property-label">Taille</span>';
          default:
            return '<span class="property-label">' + property + '</span>';
        }
      }

      // NOUVEAU: Stocker les valeurs dans data-attributes pour le toast d'annulation
      var currentValue = group.value;
      var variableName = bestSuggestion ? bestSuggestion.name : '';

      var html = '<div class="compact-row" data-indices="' + group.originalIndices.join(',') + '" data-current-value="' + currentValue + '" data-variable-name="' + variableName + '" onclick="highlightLayers([' + group.originalIndices.join(',') + '])" style="cursor: pointer;">';

      // Col 1 : Le "Problème" (Valeur Actuelle)
      html += '<div class="col-problem" title="Type: ' + group.property + ' | Valeur: ' + group.value + '">';

      // Icône de type
      html += getPropertyIcon(group.property);

      // Visuel (swatch ou valeur textuelle)
      if (group.property === "Fill" || group.property === "Stroke" || group.property === "Local Fill Style" || group.property === "Local Stroke Style" || group.property === "Text" || group.property === "Text Fill") {
        // Extraire la couleur hex du début de la valeur (avant le nom du style)
        var colorValue = group.value.split(' ')[0];
        html += '<div class="mini-swatch" style="background-color: ' + colorValue + ';"></div>';
      } else {
        html += '<span class="value-display">' + group.value + '</span>';
      }

      html += '</div>';

      // Col 2 : Le "Lien"
      html += '<div class="col-arrow">';
      html += '<div class="arrow-symbol">→</div>';
      html += '<div class="layer-count-badge" title="' + group.originalIndices.length + ' calque' + (group.originalIndices.length > 1 ? 's' : '') + ' concerné' + (group.originalIndices.length > 1 ? 's' : '') + '">Sur ' + group.originalIndices.length + ' calque' + (group.originalIndices.length > 1 ? 's' : '') + '</div>';
      html += '</div>';

      // Col 3 : La "Solution" (Variable)
      html += '<div class="col-solution">';
      if (group.suggestions && group.suggestions.length > 0) {
        if (hasConflicts) {
          // Multiple suggestions - select avec live preview et bouton apply
          html += '<div style="display: flex; align-items: center; gap: 8px;">';
          html += '<select class="conflict-select" onchange="handleConflictSelectChange([' + group.originalIndices.join(',') + '], this.value, this)">';
          html += '<option value="">Choisir parmi ' + group.suggestions.length + ' variables</option>';
          group.suggestions.forEach(function (suggestion, idx) {
            var distanceIndicator = suggestion.isExact ? '' : ' ≈';
            var valuePreview = suggestion.hex ? suggestion.hex : (suggestion.value !== undefined ? suggestion.value : "");
            html += '<option value="' + suggestion.id + '">' + suggestion.name + ' (' + valuePreview + ')' + distanceIndicator + '</option>';
          });
          html += '</select>';
          html += '<button class="btn-apply-manual" style="display: none; padding: 4px 10px; background: var(--poly-success); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s;" onclick="applyManualFix(this)">Appliquer</button>';
          html += '</div>';
        } else {
          // Single suggestion - bouton pill vert
          html += '<button class="variable-pill" data-variable-name="' + bestSuggestion.name + '" onclick="applyGroupFix([' + group.originalIndices.join(',') + '], \'' + bestSuggestion.id + '\')">';
          html += '<svg class="variable-icon" viewBox="0 0 16 16"><path fill="currentColor" d="M8 2l2.5 5 5.5.5-4 4 .5 5.5L8 12l-4 2 .5-5.5-4-4 5.5-.5L8 2z"/></svg>';
          html += '<span>' + bestSuggestion.name + '</span>';
          html += '</button>';
        }
      } else {
        // NO_MATCH case
        html += '<div class="no-match-badge" title="Aucun token sémantique ne correspond à cette valeur exacte dans votre système.">Aucun token compatible</div>';
      }
      html += '</div>';

      // Col 4 : Bouton ignorer
      html += '<button class="btn-x" onclick="this.closest(\'.compact-row\').style.display=\'none\'" title="Ignorer ce groupe">×</button>';

      html += '</div>';

      return html;
    }

    // Fonction pour corriger tous les groupes d'une catégorie
    function applyAllCategoryFixes(categoryKey) {
      // Cette fonction sera appelée depuis le HTML généré
      var categoryRows = document.querySelectorAll('details[open] .compact-row');
      var allIndices = [];
      var variableId = null;

      categoryRows.forEach(function (row) {
        var indices = row.getAttribute('data-indices');
        if (indices) {
          var indicesArray = indices.split(',').map(Number);
          allIndices = allIndices.concat(indicesArray);

          // Pour les conflits, on ne peut pas deviner quelle variable choisir
          // Donc on ne traite que les lignes sans conflit
          if (!row.querySelector('.conflict-select')) {
            var pillBtn = row.querySelector('.btn-fix-pill');
            if (pillBtn && pillBtn.onclick) {
              // Extraire le variableId du onclick (c'est un hack, mais ça marche)
              var onclickStr = pillBtn.getAttribute('onclick');
              var match = onclickStr.match(/applyGroupFix\(\[([^\]]+)\],\s*'([^']+)'\)/);
              if (match && match[2]) {
                variableId = variableId || match[2]; // Prendre le premier variableId trouvé
              }
            }
          }
        }
      });

      if (allIndices.length > 0 && variableId) {
        applyGroupFix(allIndices, variableId);
      }
    }

    // Verrou temporel pour ignorer les changements de sélection programmatiques
    window.ignoreSelectionChangeUntil = 0;

    function highlightLayers(indices) {
      // Activer le verrou pour seulement 200ms (au lieu de 2 secondes) pour éviter les conflits
      window.ignoreSelectionChangeUntil = Date.now() + 200;

      parent.postMessage({
        pluginMessage: {
          type: 'highlight-nodes',
          indices: indices
        }
      }, '*');
    }

    function selectLayers(indices) {
      highlightLayers(indices);
    }

    function applyGroupFix(indices, variableId) {
      console.log('applyGroupFix called with indices:', indices, 'variableId:', variableId);
      parent.postMessage({
        pluginMessage: {
          type: 'apply-group-fix',
          indices: indices,
          variableId: variableId
        }
      }, '*');
    }

    function applyManualGroupFix(indices, buttonElement) {
      // Trouver le sélecteur dans la même carte
      var card = buttonElement.closest('.cleaning-result-card');
      var selector = card.querySelector('.manual-select');
      var variableId = selector.value;

      if (!variableId) {
        return; // Ne rien faire si aucune variable sélectionnée
      }

      parent.postMessage({
        pluginMessage: {
          type: 'apply-group-fix',
          indices: indices,
          variableId: variableId
        }
      }, '*');
    }

    // Expose functions to global scope for inline onclick handlers
    window.highlightLayers = highlightLayers;
    window.selectLayers = selectLayers;
    window.applyGroupFix = applyGroupFix;
    window.applyManualGroupFix = applyManualGroupFix;

    // ============================================
    // ✅ CORRECTIF GLOBAL : SCROLL, FILTRES & ACTIONS
    // ============================================

    function displayScanResults(results) {

      try {
        // 1. ARRÊT IMPÉRATIF DU LOADING (Sécurité maximale)
        hideScanLoading();
        // Note: scanResults reste visible - on remplace juste les skeletons par le vrai contenu

        // 2. Gestion et vérification des données
        if (!results || results.length === 0) {
          isScanning = false;

          // Si on n'a plus du tout de sélection (ID null/vide), on montre l'état d'accueil
          if (!window.lastScannedSelectionId) {
            if (scanEmptyState) {
              scanEmptyState.classList.remove("hidden");
              scanEmptyState.style.display = 'block';
              if (!scanEmptyState.innerHTML.includes('Sélectionnez une')) {
                scanEmptyState.innerHTML = '<div style="text-align: center; padding: 60px 20px;"><div class="empty-icon">🎯</div><h3>Sélectionnez une frame.</h3><p style="text-align: center; color: var(--poly-text-muted); font-size: 13px; margin: 16px auto; max-width: 320px; line-height: 1.6;">Les écarts avec votre système de tokens seront automatiquement détectés.</p></div>';
              }
            }
            if (scanResults) {
              scanResults.classList.add("hidden");
              scanResults.style.display = 'none';
            }
            return;
          }

          // Sinon (on a une sélection mais pas d'erreurs), on montre l'état "Clean"
          // pour éviter de boucler sur l'état "Sélectionnez une frame"
          if (scanResults) {
            scanResults.classList.remove("hidden");
            scanResults.style.display = 'flex';

            var listContainer = document.getElementById('unifiedCleaningList');
            if (listContainer) {
              listContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--poly-success);">
                  <div style="font-size: 40px; margin-bottom: 20px;">✨</div>
                  <h3 style="margin-bottom: 8px; font-weight: 600;">Tout est propre !</h3>
                  <p style="color: var(--poly-text-muted); font-size: 13px; max-width: 240px; margin: 0 auto; line-height: 1.5;">Aucun écart détecté. Vos éléments utilisent déjà les bons tokens.</p>
                </div>
              `;
            }

            // Mettre à jour les stats pour vider les compteurs des onglets
            updateFilterCounts({ autoFixable: 0, manualFixes: 0 });

            // Masquer les boutons d'action globale
            var applyAllSection = document.getElementById('applyAllSection');
            if (applyAllSection) applyAllSection.style.display = 'none';
          }

          if (scanEmptyState) {
            scanEmptyState.classList.add("hidden");
            scanEmptyState.style.display = 'none';
          }
          return;
        }

        // On a des résultats
        if (scanEmptyState) {
          scanEmptyState.classList.add("hidden");
          scanEmptyState.style.display = 'none';
        }

        // 3. Traitement des données (Grouping unique)
        var groups = [];
        try {
          groups = groupResultsByValue(results);
        } catch (groupError) {
          console.error("🔥 Erreur lors du regroupement:", groupError);
          // Fallback: si le groupement échoue, on ne peut rien afficher
          alert("Erreur critique lors du traitement des résultats.");
          return;
        }

        // 4. Calcul des Stats
        var stats = { autoFixable: 0, manualFixes: 0 };
        groups.forEach(function (g) {
          // STRICT AUTO STATS: Exact same logic as generateUnifiedCleaningContent
          var best = g.suggestions && g.suggestions.length > 0 ? g.suggestions[0] : null;
          // STRICT: Only 1 suggestion AND that suggestion is Exact Match
          var isAuto = g.suggestions && g.suggestions.length === 1 && best && best.isExact === true;

          if (isAuto) {
            stats.autoFixable += (g.originalIndices ? g.originalIndices.length : 1);
          } else {
            stats.manualFixes += (g.originalIndices ? g.originalIndices.length : 1);
          }
        });

        // 5. Stockage Global
        lastScanResults = results;
        livePreviewReady = true;

        // Mise à jour UI
        updateFilterCounts(stats);
        updateFilterContent(currentFilter || 'auto');

        // 6. Génération HTML (avec tolérance aux pannes)
        var unifiedHtml = generateUnifiedCleaningContent(groups, stats);

        var listContainer = document.getElementById('unifiedCleaningList');
        if (listContainer) {
          listContainer.innerHTML = unifiedHtml;
        }

        // 7. Initialisation des vrais résultats (même si masqués temporairement)
        if (typeof attachCardEventHandlers === 'function') attachCardEventHandlers();
        if (typeof attachActionHandlers === 'function') attachActionHandlers();
        if (typeof attachGroupedActionHandlers === 'function') attachGroupedActionHandlers();
        if (typeof enableVariableSelectors === 'function') enableVariableSelectors();

        // 8. Application du Filtre par défaut
        if (!currentFilter) currentFilter = 'auto';
        console.log('APPLYFILTER appelé depuis scan (défaut):', currentFilter);
        if (typeof applyFilter === 'function') applyFilter(currentFilter);

        // 9. TRANSITION FLUIDE SUR PLACE
        // Les skeletons sont déjà affichés dans scanResults, on les remplace par le vrai contenu
        if (listContainer && unifiedHtml) {
          // Remplacer les skeletons par le vrai contenu avec animation
          listContainer.innerHTML = unifiedHtml;
          listContainer.classList.add('content-loaded');

          // Activer et mettre à jour le bouton
          var applyBtn = document.getElementById('applyAllAutoBtn');
          if (applyBtn) {
            applyBtn.disabled = false;
            applyBtn.style.opacity = '1';
            applyBtn.style.cursor = 'pointer';
            updateApplyButtonText();
          }

          // Animation ultra-fluide : les vraies cartes apparaissent en cascade élégante
          setTimeout(function () {
            var cards = listContainer.querySelectorAll('.cleaning-result-card');
            cards.forEach(function (card, index) {
              setTimeout(function () {
                card.classList.add('fade-in-card');
              }, index * 45); // Délai de 45ms pour une cascade plus serrée et fluide
            });
          }, 100); // Petit délai pour laisser le contenu s'installer
        } else {
          // Fallback si quelque chose ne va pas
          if (scanResults) {
            scanResults.classList.remove("hidden");
            scanResults.style.display = "flex";
          }
        }

        // 10. Mise à jour Footer
        if (typeof updateProblemCounter === 'function') updateProblemCounter(results.length, true);

      } catch (error) {
        console.error("🔥 CRASH DISPLAY:", error);
        if (scanResults) {
          scanResults.classList.remove("hidden");
          scanResults.style.display = 'flex';
        }
      }
    }

    // Fonction pour activer les sélecteurs de variables après un scan
    function enableVariableSelectors() {

      // Activer les anciens sélecteurs (select natifs)
      var nativeSelectors = document.querySelectorAll('select.variable-selector');

      nativeSelectors.forEach(function (selector, index) {
        selector.disabled = false;
        selector.style.background = 'var(--poly-bg)';
        selector.style.color = 'var(--poly-text)';
        selector.style.cursor = 'pointer';
        selector.title = 'Sélectionnez une variable pour l\'aperçu en direct';

        // ✨ FOCUS ATTENTION : Animation de pulsation pour attirer l'attention sur les corrections manuelles
        if (selector.classList.contains('manual-select')) {
          selector.classList.add('manual-focus-attention');
          // Retirer l'animation après 3 secondes
          setTimeout(function () {
            selector.classList.remove('manual-focus-attention');
          }, 3000);
        }


        // Remettre l'option par défaut appropriée
        var defaultOption = selector.querySelector('option[value=""]');
        if (defaultOption) {
          defaultOption.textContent = 'Choisir une variable...';
        }
      });

      // Activer les dropdowns custom
      var customSelectors = document.querySelectorAll('.custom-select-container.variable-selector-dropdown.disabled');

      customSelectors.forEach(function (container, index) {
        container.classList.remove('disabled');
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';

        // Mettre à jour le label
        var label = container.querySelector('.selected-label');
        if (label && label.textContent === 'Analyse requise') {
          label.textContent = 'Choisir une variable...';
        }

        // Animation d'attention
        if (container.closest('.manual-fix')) {
          container.classList.add('manual-focus-attention');
          setTimeout(function () {
            container.classList.remove('manual-focus-attention');
          }, 3000);
        }
      });

    }


    // ============================================
    // NOUVELLES FONCTIONS POUR LE SYSTÈME UNIFIÉ
    // ============================================

    // Mettre à jour les compteurs de filtres
    // Mettre à jour les compteurs de filtres (100% Défensif)
    function updateFilterCounts(stats) {
      if (!stats) return;

      var autoCount = document.getElementById('autoCount');
      if (autoCount) {
        var autoValue = stats.autoFixable || 0;
        autoCount.textContent = autoValue;
        autoCount.style.display = autoValue > 0 ? 'inline-flex' : 'none';
      }

      var manualCount = document.getElementById('manualCount');
      if (manualCount) {
        var manualValue = stats.manualFixes || 0;
        manualCount.textContent = manualValue;
        manualCount.style.display = manualValue > 0 ? 'inline-flex' : 'none';
      }

      // Mettre à jour le texte du bouton après avoir mis à jour les compteurs
      updateApplyButtonText();

    }

    // Mettre à jour le texte dynamique du bouton "Appliquer les corrections"
    function updateApplyButtonText() {
      var applyBtn = document.getElementById('applyAllAutoBtn');
      var autoCount = document.getElementById('autoCount');
      if (applyBtn && autoCount) {
        var count = parseInt(autoCount.textContent) || 0;
        if (count > 0) {
          applyBtn.textContent = 'Appliquer ' + count + ' correction' + (count > 1 ? 's' : '');
        } else {
          applyBtn.textContent = 'Appliquer les corrections';
        }
      }
    }

    // Recalculer dynamiquement les compteurs des onglets après corrections
    function updateDynamicTabCounts() {
      var counts = {
        auto: 0,
        manual: 0
      };

      // Fonction helper pour déterminer le type de carte
      function getCardType(card) {
        // Priorité 1: Classes CSS explicites
        if (card.classList.contains('auto-fixable') || card.classList.contains('compact-row')) {
          return 'auto';
        }
        if (card.classList.contains('manual-required')) {
          return 'manual';
        }

        // Priorité 2: Fallback sur data-suggestions (legacy)
        var suggestions = card.getAttribute('data-suggestions');
        if (suggestions) {
          try {
            var suggestionsArray = JSON.parse(suggestions);
            return (suggestionsArray && suggestionsArray.length === 1) ? 'auto' : 'manual';
          } catch (e) {
            console.warn('[updateDynamicTabCounts] Erreur parsing data-suggestions:', e);
          }
        }

        // Défaut: considérer comme manuel si rien n'est défini
        return 'manual';
      }

      // Fonction helper pour vérifier si une carte doit être exclue du comptage
      function shouldExcludeCard(card) {
        var cardIndices = JSON.parse(card.getAttribute('data-indices') || '[]');
        var cardSignature = card.getAttribute('data-card-signature');
        var cardClasses = card.className;

        console.log('[DEBUG shouldExcludeCard] Carte:', cardClasses, 'Indices:', cardIndices, 'Signature:', cardSignature);

        // IMPORTANT: Ne pas exclure les cartes masquées par le filtre actuel,
        // car updateDynamicTabCounts doit compter TOUTES les cartes valides indépendamment du filtre

        // 1. Exclure les cartes marquées comme ignorées
        if (card.classList.contains('is-ignored-permanently')) {
          console.log('[DEBUG shouldExcludeCard] Exclue - classe is-ignored-permanently');
          return true;
        }

        // 2. Vérifier les indices ignorés globalement (PAS les appliedResultIndices)
        var hasIgnoredIndices = cardIndices.some(function (idx) {
          var isIgnored = ignoredResultIndices.indexOf(idx) !== -1;
          if (isIgnored) console.log('[DEBUG shouldExcludeCard] Index ignoré trouvé:', idx);
          return isIgnored;
        });
        if (hasIgnoredIndices) {
          console.log('[DEBUG shouldExcludeCard] Exclue - indices ignorés');
          return true;
        }

        // Note: Les appliedResultIndices ne sont PAS exclus - ils peuvent réapparaître après undo

        // 3. Vérifier la signature de carte ignorée
        if (cardSignature && ignoredCardSignatures.indexOf(cardSignature) !== -1) {
          console.log('[DEBUG shouldExcludeCard] Exclue - signature ignorée:', cardSignature);
          return true;
        }

        console.log('[DEBUG shouldExcludeCard] Garde - carte valide');
        return false;
      }

      // Analyser TOUTES les cartes
      var cards = document.querySelectorAll('.cleaning-result-card, .compact-row');

      console.log('[DEBUG updateDynamicTabCounts] === DÉBUT COMPTAGE ===');
      console.log('Variables globales AU MOMENT DU COMPTAGE:');
      console.log('  ignoredResultIndices:', ignoredResultIndices);
      console.log('  ignoredCardSignatures:', ignoredCardSignatures);
      console.log('  Nombre de cartes trouvées:', cards.length);

      cards.forEach(function (card) {
        // Exclure les cartes qui ne doivent pas être comptées
        if (shouldExcludeCard(card)) {
          return;
        }

        // Récupérer les indices de cette carte
        var cardIndices = JSON.parse(card.getAttribute('data-indices') || '[]');
        var appliedIndices = card._appliedIndices || [];

        // Filtrer les indices qui ne sont pas ignorés
        var validIndices = cardIndices.filter(function (idx) {
          return ignoredResultIndices.indexOf(idx) === -1;
        });

        // Compter les indices valides non encore appliqués
        var remainingIndices = validIndices.filter(function (idx) {
          return !appliedIndices.includes(idx);
        });

        if (remainingIndices.length > 0) {
          var cardType = getCardType(card);
          counts[cardType] += remainingIndices.length;
        }
      });

      // Mettre à jour les badges des onglets
      updateTabBadge('autoCount', counts.auto);
      updateTabBadge('manualCount', counts.manual);

      console.log('[DEBUG updateDynamicTabCounts] Comptage final - Auto:', counts.auto, 'Manual:', counts.manual);
    }

    // Fonction helper pour mettre à jour un badge spécifique
    function updateTabBadge(badgeId, count) {
      var badge = document.getElementById(badgeId);
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
      }
    }

    // Générer le contenu unifié avec tolérance aux erreurs
    function generateUnifiedCleaningContent(resultsOrGroups, stats) {
      if (!resultsOrGroups || resultsOrGroups.length === 0) {
        return '<div class="empty-state-enhanced"><div class="empty-icon">✨</div><h3>Aucun problème détecté</h3><p>Votre design utilise déjà des variables partout !</p></div>';
      }

      var groups = resultsOrGroups;
      // Compatibilité: si on reçoit des résultats plats, on les groupe
      if (groups.length > 0 && !groups[0].originalIndices) {
        try {
          groups = groupResultsByValue(groups);
        } catch (e) { console.error("Grouping error inside generate:", e); return '<p class="error">Erreur de groupement</p>'; }
      }

      // Filtrer les groupes qui contiennent uniquement des éléments ignorés
      console.log('Filtrage groupes ignorés. Groupes avant:', groups.length, 'ignoredCardSignatures:', ignoredCardSignatures, 'ignoredResultIndices:', ignoredResultIndices);

      // Premier filtrage : signatures de cartes ignorées
      if (ignoredCardSignatures.length > 0) {
        groups = groups.filter(function (group) {
          if (!group.originalIndices) return true;
          // Créer la signature de ce groupe
          var groupSignature = 'card_' + group.originalIndices.sort().join('_');
          var shouldKeep = ignoredCardSignatures.indexOf(groupSignature) === -1;
          if (!shouldKeep) {
            console.log('Groupe filtré (signature ignorée):', groupSignature);
          }
          return shouldKeep;
        });
      }

      // Second filtrage : indices individuels ignorés définitivement (NE PAS filtrer les appliedResultIndices)
      if (ignoredResultIndices.length > 0) {
        groups = groups.filter(function (group) {
          if (!group.originalIndices) return true;
          // Vérifier si au moins un indice du groupe est dans les ignorés permanents
          var hasIgnoredIndices = group.originalIndices.some(function (index) {
            return ignoredResultIndices.indexOf(index) !== -1;
          });
          if (hasIgnoredIndices) {
            console.log('Groupe filtré (contient indices ignorés):', group.originalIndices);
            return false; // Ne pas garder ce groupe
          }
          return true; // Garder ce groupe
        });
      }

      // Note: Les appliedResultIndices ne sont PAS filtrés ici - ils peuvent réapparaître après undo

      console.log('Groupes après filtrage:', groups.length);

      var html = '';

      groups.forEach(function (group, index) {
        var cardHtml = ''; // Isolated string for this specific card
        try {
          var hasConflicts = group.suggestions && group.suggestions.length > 1;
          // ✅ AUTO si exactement 1 suggestion ET match exact (100% confiance)
          var bestSuggestion = group.suggestions && group.suggestions.length > 0 ? group.suggestions[0] : null;
          var itemCount = group.originalIndices ? group.originalIndices.length : 0;
          // STRICT AUTO: Only if 1 suggestion AND that suggestion is EXACT Match
          var isAutoFixable = group.suggestions && group.suggestions.length === 1 && bestSuggestion && bestSuggestion.isExact === true;
          var isOrphan = !group.suggestions || group.suggestions.length === 0;

          // Classes CSS pour les filtres
          var cardClass = 'cleaning-result-card grouped-card';
          if (isAutoFixable) {
            cardClass += ' auto-fixable';
          } else {
            cardClass += ' manual-required';
          }

          // Génération sûre des attributs data
          var indicesJson = '[]';
          try { indicesJson = JSON.stringify(group.originalIndices || []).replace(/"/g, '&quot;'); } catch (e) { }

          var cardDataJson = '{}';
          try { cardDataJson = JSON.stringify({ property: group.property, value: group.value, suggestions: group.suggestions }).replace(/"/g, '&quot;'); } catch (e) { }

          // DEBUT CARTE
          var suggestedVariableId = bestSuggestion ? bestSuggestion.id : '';
          cardHtml += '<div class="' + cardClass + '" data-indices="' + indicesJson + '" data-group-index="' + index + '" data-suggested-variable="' + suggestedVariableId + '" style="display: flex; flex-direction: column; padding: 12px 16px; margin-bottom: 8px; background: var(--poly-surface); border: 1px solid var(--poly-border-subtle); border-radius: 12px;">';

          // HEADER (Propriété + Actions)
          cardHtml += '<div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">';

          // GAUCHE: Icône + Nom Propriété
          cardHtml += '<div style="display: flex; align-items: center; gap: 6px;">';
          cardHtml += '<span style="color: var(--poly-accent);">' + getPropertyIcon(group.property) + '</span>';

          // Ajouter un badge de contexte (Text vs Shape) uniquement pour les couleurs
          if ((group.property === 'Fill' || group.property === 'Stroke' || group.property === 'Local Fill Style' || group.property === 'Local Stroke Style' || group.property === 'Text Fill') && group.category === 'TEXT') {
            cardHtml += '<span class="context-badge">Typo</span>';
          } else if ((group.property === 'Fill' || group.property === 'Stroke' || group.property === 'Local Fill Style' || group.property === 'Local Stroke Style' || group.property === 'Text Fill') && group.category === 'SHAPE') {
            cardHtml += '<span class="context-badge">Forme</span>';
          }

          cardHtml += '</div>';

          // DROITE: Actions (Voir, Appliquer, Ignorer)
          cardHtml += '<div style="display: flex; gap: 6px;">';

          // Bouton Voir
          cardHtml += '<button class="btn-outline btn-view" data-action="view" data-indices="' + indicesJson + '" title="Voir dans Figma" style="width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
            '</button>';

          // Bouton Appliquer
          var applyDisabled = (isOrphan || hasConflicts) ? 'disabled' : '';
          var applyClass = isOrphan ? 'btn-outline' : 'btn-primary';
          cardHtml += '<button class="' + applyClass + ' btn-apply-action" data-action="apply" data-indices="' + indicesJson + '" ' + applyDisabled + ' title="Appliquer" style="width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg>' +
            '</button>';

          // Bouton Ignorer
          cardHtml += '<button class="btn-x" data-action="ignore" data-indices="' + indicesJson + '" title="Ignorer" style="width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>';

          cardHtml += '</div>'; // Fin Actions
          cardHtml += '</div>'; // Fin Header

          // BODY (Comparaison Valeurs) - Layout optimisé avec space-between
          cardHtml += '<div class="card-body" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">';

          // 1. Valeur Actuelle (côté gauche)
          cardHtml += '<div style="flex-shrink: 0; min-width: 0;">';
          var displayValue = group.value;
          if (typeof displayValue === 'object') displayValue = 'Mixte';

          cardHtml += '<div style="display: flex; align-items: center; gap: 8px;">';
          if ((group.property === 'Fill' || group.property === 'Stroke' || group.property === 'Local Fill Style' || group.property === 'Local Stroke Style' || group.property === 'Text' || group.property === 'Text Fill') && typeof displayValue === 'string' && displayValue.startsWith('#')) {
            cardHtml += '<div style="width: 20px; height: 20px; border-radius: 4px; background-color: ' + displayValue + '; border: 1px solid var(--poly-border-subtle);"></div>';
            cardHtml += '<div style="display: flex; flex-direction: column;">';
            cardHtml += '<span style="font-family: monospace; font-size: 11px; color: var(--poly-text);">' + displayValue + '</span>';
            // Afficher le token suggéré si disponible
            if (bestSuggestion && !isOrphan && !hasConflicts) {
              cardHtml += '<span style="font-size: 10px; color: var(--poly-accent); font-weight: 600;">→ ' + bestSuggestion.name + '</span>';
            }
            cardHtml += '<span style="font-size: 10px; color: var(--poly-text-muted);">' + itemCount + ' calque(s)</span>';
            cardHtml += '</div>';
          } else {
            cardHtml += '<div style="display: flex; flex-direction: column; overflow: hidden;">';
            cardHtml += '<span style="font-family: monospace; font-size: 11px; color: var(--poly-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + displayValue + '</span>';
            // Afficher le token suggéré si disponible
            if (bestSuggestion && !isOrphan && !hasConflicts) {
              cardHtml += '<span style="font-size: 10px; color: var(--poly-accent); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">→ ' + bestSuggestion.name + '</span>';
            }
            cardHtml += '<span style="font-size: 10px; color: var(--poly-text-muted);">' + itemCount + ' calque(s)</span>';
            cardHtml += '</div>';
          }
          cardHtml += '</div>'; // Fin Valeur Actuelle wrapper
          cardHtml += '</div>'; // Fin Valeur Actuelle Container

          // 2. Flèche + Nouvelle Valeur (côté droite, regroupés)
          cardHtml += '<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">';

          // Flèche
          cardHtml += '<div style="color: var(--poly-text-muted); flex-shrink: 0;">⟶</div>';

          // Nouvelle Valeur (Fix) - maintenant dans le même container que la flèche
          cardHtml += '<div style="display: flex; align-items: center;">';

          if (isOrphan) {
            cardHtml += '<span style="color: var(--poly-warning); font-size: 11px; font-style: italic;">Aucune variable compatible</span>';
          } else if (isAutoFixable && bestSuggestion) {
            // Auto-fixable display - nom de la variable en exergue, alignement horizontal
            var resolvedValue = bestSuggestion.resolvedValue || bestSuggestion.value;

            if (typeof bestSuggestion.resolvedValue === 'string' && bestSuggestion.resolvedValue.startsWith('#')) {
              cardHtml += '<div style="display: flex; align-items: center; gap: 4px;">';
              cardHtml += '<div style="width: 20px; height: 20px; border-radius: 4px; background-color: ' + bestSuggestion.resolvedValue + '; border: 1px solid var(--poly-border-subtle);"></div>';
              cardHtml += '<div style="display: flex; align-items: baseline; gap: 4px;"><span style="font-size: 12px; color: var(--poly-text); font-weight: 600;">' + bestSuggestion.name + '</span><span style="font-size: 10px; color: var(--poly-text-muted); font-family: monospace;">' + resolvedValue + '</span></div>';
              cardHtml += '</div>';
            } else {
              cardHtml += '<div style="display: flex; align-items: baseline; gap: 4px;"><span style="font-size: 12px; color: var(--poly-text); font-weight: 600;">' + bestSuggestion.name + '</span><span style="font-size: 10px; color: var(--poly-text-muted); font-family: monospace;">' + resolvedValue + '</span></div>';
            }
          } else {
            // Manual Fallback (Conflicts OR Single Approximate)
            // Utiliser le nouveau système de boutons intelligents
            cardHtml += renderSmartSuggestions(group.suggestions, group.property, group.originalIndices);

            // Garder le dropdown en "backup" caché si besoin pour le bouton "+X"
            if (group.suggestions.length > 3) {
              cardHtml += '<div style="display: none;">';
              cardHtml += generateCustomVariableSelector(group.suggestions, group.originalIndices);
              cardHtml += '</div>';
            }
          }
          cardHtml += '</div>'; // Fin Nouvelle Valeur
          cardHtml += '</div>'; // Fin Flèche + Nouvelle Valeur container

          cardHtml += '</div>'; // Fin Body
          cardHtml += '</div>'; // Fin Carte

          // ✅ ON AJOUTE SEULEMENT SI TOUT LE BLOC A ÉTÉ GÉNÉRÉ SANS ERREUR
          html += cardHtml;

        } catch (cardError) {
          console.error("Skipping bad card (property: " + group.property + "):", cardError);
        }
      }); // End forEach

      return html;
    }

    // ✅ FIX DES DROPDOWNS (Delegation Uniquement pour Dropdowns)
    function setupDropdownDelegation() {
      var list = document.getElementById('unifiedCleaningList');
      if (!list) return;

      list.onclick = function (e) {
        var target = e.target;

        // 1. Gérer les Dropdowns Custom (Trigger)
        var trigger = target.closest('.select-trigger');
        if (trigger) {
          var container = trigger.closest('.custom-select-container');
          toggleCustomDropdown(container);
          e.stopPropagation();
          return;
        }

        // 2. Gérer le choix d'option
        var option = target.closest('.option-item');
        if (option) {
          handleDropdownOptionClick(option);
          e.stopPropagation();
          return;
        }
      };

      // Fermer au clic externe
      list.addEventListener('mousedown', function (e) {
        if (!e.target.closest('.custom-select-container')) {
          closeAllDropdowns();
        }
      });
    }

    // ✅ FIX DE LA SÉLECTION (CLIC CARD)
    function attachCardEventHandlers() {
      // 1. Clic sur la carte (Sélection Figma)
      var cards = document.querySelectorAll('.cleaning-result-card');
      cards.forEach(function (card) {
        card.addEventListener('click', function (event) {
          // Ignorer si on clique sur un élément interactif interne
          if (event.target.closest('button') ||
            event.target.closest('.custom-select-container') ||
            event.target.closest('.variable-selector')) {
            return;
          }

          var indicesStr = card.getAttribute('data-indices');
          if (indicesStr) {
            try {
              var indices = JSON.parse(indicesStr);
              selectNodesInFigma(indices);
            } catch (e) { console.error("Erreur parsing indices", e); }
          }
        });
      });

      // 2. Dropdowns
      setupDropdownDelegation();
    }

    // --- Helpers Event Delegation ---

    function toggleCustomDropdown(container) {
      if (!container) return;
      var isOpen = container.classList.contains('open');
      closeAllDropdowns(); // Fermer les autres
      if (!isOpen) container.classList.add('open');
    }

    function closeAllDropdowns() {
      document.querySelectorAll('.custom-select-container.open').forEach(function (el) {
        el.classList.remove('open');
      });
    }

    function handleDropdownOptionClick(option) {
      var container = option.closest('.custom-select-container');
      var trigger = container.querySelector('.select-trigger');
      var card = option.closest('.cleaning-result-card');

      var variableId = option.getAttribute('data-variable-id');
      var variableName = option.getAttribute('data-variable-name');
      var variableValue = option.getAttribute('data-variable-value');

      // Update UI Dropdown
      trigger.querySelector('.selected-label').textContent = variableName;
      var dot = trigger.querySelector('.color-dot');
      if (dot) dot.style.background = variableValue.startsWith('#') ? variableValue : 'var(--poly-surface-soft)';

      // Marquer l'option sélectionnée visuellement
      container.querySelectorAll('.option-item').forEach(function (opt) { opt.classList.remove('selected'); });
      option.classList.add('selected');

      // Stocker la sélection sur la carte
      card.setAttribute('data-selected-variable', variableId);
      // Compatibility with bulk actions
      card._selectedVariableId = variableId;

      // Activer le bouton Appliquer
      var applyBtn = card.querySelector('button[data-action="apply"]');
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.classList.remove('btn-outline');
        applyBtn.classList.add('btn-primary');
        applyBtn.title = 'Appliquer ' + variableName;
      }

      // Close Dropdown
      container.classList.remove('open');

      // Trigger Live Preview
      if (livePreviewReady && card) {
        var indices = JSON.parse(card.getAttribute('data-indices'));
        sendPreviewFix(indices, variableId);
      }
    }

    function handleApplyAction(btn, indices) {
      var card = btn.closest('.cleaning-result-card');
      // 1. Chercher la variable sélectionnée manuellement
      var variableId = card.getAttribute('data-selected-variable');

      // 2. Sinon, chercher si c'est une auto-fix (suggestion unique)
      if (!variableId) {
        var cardDataStr = card.getAttribute('data-card-data');
        if (cardDataStr) {
          var cardData = JSON.parse(cardDataStr);
          if (cardData.suggestions && cardData.suggestions.length === 1) {
            variableId = cardData.suggestions[0].id;
          }
        }
      }

      if (variableId) {
        applyGroupFix(indices, variableId);
      } else {
        // Fallback: si c'est un conflit et rien n'est sélectionné, ouvrir le dropdown
        var dropdownTrigger = card.querySelector('.select-trigger');
        if (dropdownTrigger) dropdownTrigger.click();
      }
    }

    // Gestion de la sélection pour les cartes groupées
    function handleGroupedItemSelection(card, isSelected) {

      var dataIndices = card.getAttribute('data-indices');

      if (isSelected) {
        card.classList.add('selected');

        if (dataIndices) {
          try {
            var indicesToAdd = JSON.parse(dataIndices);
            selectedIndices = selectedIndices.concat(indicesToAdd);
          } catch (parseError) {
            console.error('[handleGroupedItemSelection] ❌ Erreur parsing data-indices:', parseError);
          }
        } else {
          console.warn('[handleGroupedItemSelection] ⚠️ Attribut data-indices manquant sur la carte');
        }
      } else {
        card.classList.remove('selected');

        if (dataIndices) {
          try {
            var cardIndices = JSON.parse(dataIndices);
            var beforeLength = selectedIndices.length;
            selectedIndices = selectedIndices.filter(function (idx) {
              return cardIndices.indexOf(idx) === -1;
            });
          } catch (parseError) {
            console.error('[handleGroupedItemSelection] ❌ Erreur parsing data-indices:', parseError);
          }
        }
      }

      updateBulkActionsVisibility();
      updateBulkActionsCounts();
    }

    // Gestionnaires d'actions pour les cartes groupées
    function attachGroupedActionHandlers() {
      // Boutons Appliquer groupés
      var applyButtons = document.querySelectorAll('button[data-action="apply"]');
      applyButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var indices = JSON.parse(this.getAttribute('data-indices'));
          var card = this.closest('.cleaning-result-card');
          var selectedVariableId = card._selectedVariableId;

          if (!selectedVariableId) {
            // --- CORRECTION DU BUG ICI ---
            // Ancienne logique erronée : if (suggestions && suggestions.length === 1)

            // Nouvelle logique : On récupère toujours la suggestion du premier élément du groupe
            // (car tous les éléments d'un groupe "Auto" partagent la même suggestion)
            var groupIndices = JSON.parse(card.getAttribute('data-indices'));

            if (groupIndices && groupIndices.length > 0 && lastScanResults) {
              // On prend le premier résultat du groupe pour trouver l'ID de la variable
              var firstResult = lastScanResults[groupIndices[0]];
              if (firstResult) {
                selectedVariableId = firstResult.suggestedVariableId;
              }
            }
          }

          if (selectedVariableId) {
            applyGroupedFix(indices, selectedVariableId);
          }
        });
      });

      // Boutons Ignorer (groupés et individuels)
      var ignoreButtons = document.querySelectorAll('button[data-action="ignore"]');
      console.log('Attachement des événements ignore à', ignoreButtons.length, 'boutons');
      ignoreButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          console.log('Bouton ignore cliqué:', this);
          // Gérer les boutons individuels (data-index) et groupés (data-indices)
          var indices;
          var dataIndices = this.getAttribute('data-indices');
          var dataIndex = this.getAttribute('data-index');

          if (dataIndices) {
            // Bouton groupé
            indices = JSON.parse(dataIndices);
            console.log('Bouton groupé avec indices:', indices);
          } else if (dataIndex) {
            // Bouton individuel - convertir en tableau
            indices = [parseInt(dataIndex)];
            console.log('Bouton individuel avec index:', dataIndex, '-> indices:', indices);
          } else {
            console.error('Bouton ignore sans data-indices ni data-index');
            return;
          }

          ignoreGroupedItems(indices, this);
        });
      });

      // Boutons Voir groupés (sélectionner les calques dans Figma)
      var viewButtons = document.querySelectorAll('button[data-action="view"]');
      viewButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var indices = JSON.parse(this.getAttribute('data-indices'));

          // Gérer l'état visuel de la carte
          document.querySelectorAll('.cleaning-result-card').forEach(function (c) {
            c.classList.remove('selected');
          });

          var card = this.closest('.cleaning-result-card');
          if (card) {
            card.classList.add('selected');
          }

          if (indices && indices.length > 0) {
            selectNodesInFigma(indices);
          }
        });
      });
    }

    // ============================================
    // FONCTIONS POUR CARTES GROUPÉES
    // ============================================

    function applyGroupedFix(indices, variableId) {

      // Trouver et animer la card avant l'application
      var card = document.querySelector('.cleaning-result-card[data-indices*="' + indices[0] + '"]');
      if (card) {
        // Animation de succès
        card.style.transition = 'all 0.3s ease';
        card.style.backgroundColor = 'var(--poly-success-light)';
        card.style.borderColor = 'var(--poly-success)';

        // Désactiver temporairement les contrôles
        var checkbox = card.querySelector('.item-checkbox');
        var buttons = card.querySelectorAll('button[data-action]');
        if (checkbox) checkbox.disabled = true;
        buttons.forEach(function (btn) { btn.disabled = true; });
      }

      // Animation initiale de la card
      if (card) {
        card.style.transition = 'all 0.3s ease';
        card.style.backgroundColor = 'var(--poly-success-light)';
        card.style.borderColor = 'var(--poly-success)';

        var buttons = card.querySelectorAll('button[data-action]');
        buttons.forEach(function (btn) { btn.disabled = true; });
      }

      // Envoyer les messages de correction pour chaque index
      indices.forEach(function (index) {
        if (lastScanResults && lastScanResults[index]) {
          var result = lastScanResults[index];

          // Envoyer un message au plugin principal pour appliquer la correction
          parent.postMessage({
            pluginMessage: {
              type: "apply-single-fix",
              index: index,
              nodeId: result.nodeId,
              property: result.property,
              fillIndex: result.fillIndex,
              strokeIndex: result.strokeIndex,
              selectedVariableId: variableId
            }
          }, "*");
        } else {
        }
      });
    }

    function ignoreGroupedItems(indices, btnElement) {
      console.log('ignoreGroupedItems appelé avec indices:', indices, 'btnElement:', btnElement);

      // Trouver la carte parente directement via le DOM
      var card = btnElement ? btnElement.closest('.cleaning-result-card') : null;
      console.log('Carte trouvée:', card);

      if (card) {
        // MARQUAGE IMMÉDIAT : Ajouter la classe et masquer immédiatement
        card.classList.add('is-ignored-permanently');
        card.style.display = 'none';

        // Ajouter les indices au tableau global pour la persistance si on re-scanne
        indices.forEach(function (index) {
          if (ignoredResultIndices.indexOf(index) === -1) {
            ignoredResultIndices.push(index);
            console.log('Index ajouté aux ignorés permanents:', index);
          }
        });
        console.log('Indices ignorés permanents actuels:', ignoredResultIndices);

        // Créer une signature unique pour cette carte basée sur ses indices (pour compatibilité)
        var cardSignature = 'card_' + indices.sort().join('_');
        if (ignoredCardSignatures.indexOf(cardSignature) === -1) {
          ignoredCardSignatures.push(cardSignature);
          console.log('Signature ajoutée aux ignorés:', cardSignature);
        }
        // ❌ SUPPRIMÉ : updateProblemCounter() - Cause des animations parasites sur le compteur
        // ❌ SUPPRIMÉ : updateDynamicTabCounts() - Cause des animations parasites
        console.log('Carte ignorée immédiatement:', card.getAttribute('data-indices'));
      } else {
        // Fallback si la card n'est pas trouvée (ne devrait plus arriver avec l'approche DOM direct)
        console.log('ATTENTION: Carte non trouvée pour ignoreGroupedItems, indices:', indices);
      }

      // Feedback utilisateur
      showNotification(indices.length + ' élément' + (indices.length > 1 ? 's' : '') + ' ignoré' + (indices.length > 1 ? 's' : ''), 'info');

      // Restaurer l'état original des nœuds (annulation des live previews éventuelles)
      parent.postMessage({
        pluginMessage: {
          type: "rollback-preview",
          indices: indices
        }
      }, "*");
    }

    function updateBulkActionsVisibility() {

      var bulkContainer = document.getElementById('bulkActionsContainer');
      var bulkBtn = document.getElementById('bulkFixBtn');


      if (selectedIndices.length > 0 && bulkContainer && bulkBtn) {
        bulkContainer.style.display = 'block';
        bulkBtn.disabled = false;
      } else if (bulkContainer) {
        bulkContainer.style.display = 'none';
      } else {
        console.warn('[updateBulkActionsVisibility] ⚠️ bulkContainer non trouvé dans le DOM');
      }
    }

    function updateBulkActionsCounts() {
      var applyCount = document.getElementById('applyCount');
      var ignoreCount = document.getElementById('ignoreCount');

      if (applyCount) applyCount.textContent = '(' + selectedIndices.length + ')';
      if (ignoreCount) ignoreCount.textContent = '(' + selectedIndices.length + ')';
    }

    function applyBulkFixes() {

      var indicesToRemove = selectedIndices.slice(); // Copier les indices avant de les vider
      var results = {
        total: selectedIndices.length,
        successful: 0,
        failed: 0,
        details: []
      };

      // Traiter chaque correction avec vérification détaillée
      for (var i = 0; i < selectedIndices.length; i++) {
        var index = selectedIndices[i];
        if (lastScanResults && lastScanResults[index]) {
          var scanResult = lastScanResults[index];


          try {
            // Utiliser le nouveau système avec vérification
            var verificationResult = applyAndVerifyFix(scanResult, scanResult.suggestedVariableId);

            if (verificationResult.success) {
              results.successful++;
            } else {
              results.failed++;
            }

            // Stocker les détails pour analyse
            results.details.push({
              index: index,
              scanResult: scanResult,
              verificationResult: verificationResult,
              diagnosis: verificationResult.diagnosis
            });

          } catch (error) {
            results.failed++;
            console.error('[applyBulkFixes] 💥 ERREUR CRITIQUE pour index', index, ':', error);

            results.details.push({
              index: index,
              scanResult: scanResult,
              verificationResult: {
                success: false,
                error: error.message,
                details: { duration: 0 }
              }
            });
          }
        } else {
          results.failed++;
          console.warn('[applyBulkFixes] ⚠️ Résultat de scan manquant pour index', index);

          results.details.push({
            index: index,
            scanResult: null,
            verificationResult: {
              success: false,
              error: 'Résultat de scan manquant',
              details: { duration: 0 }
            }
          });
        }
      }

      // Vider la sélection après application
      selectedIndices = [];
      updateBulkActionsVisibility();

      // Mettre à jour l'UI localement
      updateUILocally(indicesToRemove);

      // Notification détaillée

      if (results.successful > 0) {
        figma.notify('✅ ' + results.successful + '/' + results.total + ' corrections appliquées avec succès');
      }

      if (results.failed > 0) {
        console.warn('[applyBulkFixes] ⚠️', results.failed, 'corrections ont échoué. Détails:');

        // Grouper les erreurs par type pour un rapport plus clair
        var errorGroups = {};
        results.details.forEach(function (detail) {
          if (!detail.verificationResult.success && detail.verificationResult.diagnosis) {
            var issue = detail.verificationResult.diagnosis.issue;
            if (!errorGroups[issue]) {
              errorGroups[issue] = {
                count: 0,
                examples: [],
                recommendations: detail.verificationResult.diagnosis.recommendations
              };
            }
            errorGroups[issue].count++;
            if (errorGroups[issue].examples.length < 3) {
              errorGroups[issue].examples.push(detail.scanResult.layerName + ' (' + detail.scanResult.property + ')');
            }
          }
        });

        // Afficher le rapport groupé
        Object.keys(errorGroups).forEach(function (issue) {
          var group = errorGroups[issue];
          if (group.recommendations.length > 0) {
          }
        });

        figma.notify('⚠️ ' + results.failed + ' corrections ont échoué - voir console pour diagnostic');
      }

      // Retourner les résultats détaillés pour analyse
      return results;
    }

    function updateUILocally(removedIndices) {

      // Supprimer les cartes correspondantes du DOM
      removedIndices.forEach(function (index) {
        var cards = document.querySelectorAll('.cleaning-result-card');
        cards.forEach(function (card) {
          var cardIndices = JSON.parse(card.getAttribute('data-indices') || '[]');
          if (cardIndices.includes(index)) {
            // Supprimer la carte
            card.remove();
          }
        });
      });

      // Mettre à jour les compteurs dans la status bar
      var remainingCards = document.querySelectorAll('.cleaning-result-card').length;
      updateProblemCounter(remainingCards, false);

      // Masquer la jauge de progression si plus de problèmes (elle sera remplacée par la célébration)
      if (remainingCards === 0) {

        // ✨ CÉLÉBRATION : Afficher la célébration pour 100%
        var scanResults = document.getElementById('scanResults');
        var scanEmptyState = document.getElementById('scanEmptyState');
        if (scanResults) scanResults.classList.add('hidden');
        if (scanEmptyState) {
          scanEmptyState.innerHTML = `
            <div class="celebration-confetti">
              <div class="empty-icon celebration-pulse">🎉</div>
              <h3 style="background: linear-gradient(45deg, var(--poly-accent), var(--poly-accent-hover)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Félicitations ! 🎊
              </h3>
              <p>Toutes les corrections ont été appliquées avec succès !</p>
              <p style="font-size: 14px; opacity: 0.8;">Votre design utilise maintenant des variables partout ✨</p>
            </div>
          `;
          scanEmptyState.classList.remove('hidden');
        }
      }
    }

    function updateScanProgress(progress, current, total, status) {
      // Mettre à jour la barre de progression dans l'état de chargement
      var loadingFill = document.querySelector('.loading-fill');
      var loadingBar = document.querySelector('.loading-bar');

      if (loadingFill && loadingBar) {
        loadingFill.style.width = progress + '%';
        loadingBar.style.display = 'block';
      }

      // Fonction désactivée - le chargement se fait maintenant de manière fluide sur place
      // Les skeletons sont automatiquement remplacés par le vrai contenu
      console.log('Loading progress:', progress, status);
    }

    function selectNodesInFigma(indices) {
      // Activer le verrou pour éviter l'auto-scan intempestif
      window.ignoreSelectionChangeUntil = Date.now() + 2000;

      // Envoyer les indices des résultats pour sélectionner les nœuds dans Figma
      parent.postMessage({
        pluginMessage: {
          type: "highlight-nodes",
          indices: indices
        }
      }, "*");
    }

    function handleSingleFixApplied(appliedCount, error, index) {
      if (error) {
        console.error('Erreur lors de l\'application de la correction:', error);
        showNotification('Erreur lors de l\'application de la correction', 'error');

        // ✅ FIX: Annuler l'animation verte et réactiver les boutons
        var cards = document.querySelectorAll('.cleaning-result-card, .compact-row');
        cards.forEach(function (card) {
          var cardIndices = JSON.parse(card.getAttribute('data-indices') || '[]');
          if (cardIndices.includes(index)) {
            // Animation d'erreur (rouge)
            card.style.transition = 'all 0.3s ease';
            card.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            card.style.borderColor = 'rgb(239, 68, 68)';

            // Réactiver les boutons
            var buttons = card.querySelectorAll('button[data-action]');
            buttons.forEach(function (btn) { btn.disabled = false; });

            // Retour à la normale après 2s
            setTimeout(function () {
              card.style.backgroundColor = '';
              card.style.borderColor = '';
              card.style.transition = '';
            }, 2000);
          }
        });
        return;
      }

      if (appliedCount > 0) {
        // Trouver et animer la card correspondante (compact-row ou cleaning-result-card)
        var cards = document.querySelectorAll('.cleaning-result-card, .compact-row');
        var targetCard = null;

        cards.forEach(function (card) {
          var cardIndices = JSON.parse(card.getAttribute('data-indices') || '[]');
          if (cardIndices.includes(index)) {
            targetCard = card;
          }
        });

        if (targetCard) {
          console.log('[DEBUG] Carte cible trouvée, vérification des conditions d\'animation');
          console.log('[DEBUG] opacity:', targetCard.style.opacity, 'display:', targetCard.style.display);

          // Ne faire l'animation que si la carte n'est pas déjà en cours d'animation depuis l'UI
          if (targetCard.style.opacity !== '0' && targetCard.style.display !== 'none') {
            console.log('[DEBUG] Conditions remplies, lancement de l\'animation');

            // Trouver le container parent pour gérer temporairement l'overflow
            var parentContainer = targetCard.closest('#scanResults') || targetCard.closest('.cleaning-cards-grid') || targetCard.parentElement;
            var originalOverflow = parentContainer ? parentContainer.style.overflow : '';

            // Animation de succès temporaire (150ms) - plus rapide et dynamique
            targetCard.style.transition = 'all 0.15s ease';
            targetCard.style.backgroundColor = 'var(--poly-success-light)';
            targetCard.style.borderColor = 'var(--poly-success)';

            // Après 150ms d'état de succès, masquer instantanément (pas d'animation CSS du tout)
            setTimeout(function () {
              // 🔴 IMPORTANT : Marquer les indices comme appliqués (pas ignorés) AVANT de cacher
              cardIndices.forEach(function (index) {
                if (appliedResultIndices.indexOf(index) === -1) {
                  appliedResultIndices.push(index);
                }
              });

              // ✨ CACHER la carte INSTANTANÉMENT sans AUCUNE animation CSS
              targetCard.style.display = 'none';

              // Nettoyer les styles de feedback vert
              targetCard.style.backgroundColor = '';
              targetCard.style.borderColor = '';

              // ❌ SUPPRIMÉ : updateProblemCounter() - Cause des animations parasites sur le compteur
              // ❌ SUPPRIMÉ : updateDynamicTabCounts() - Cause des animations parasites
              // ❌ SUPPRIMÉ : applyFilter() - Cause des animations parasites

              // Plus de mise à jour d'interface pendant l'animation
            }, 150);
          } else {
            console.log('[DEBUG] Conditions d\'animation non remplies, skip');
          }

          // Désactiver les contrôles
          var buttons = targetCard.querySelectorAll('button[data-action]');
          buttons.forEach(function (btn) { btn.disabled = true; });

          // Marquer cette correction comme réussie
          if (!targetCard._appliedIndices) {
            targetCard._appliedIndices = [];
          }
          targetCard._appliedIndices.push(index);

          // ❌ SUPPRIMÉ : Mise à jour des compteurs pendant l'animation - Cause des animations parasites

          // Vérifier si toutes les corrections du groupe sont appliquées
          var cardIndices = JSON.parse(targetCard.getAttribute('data-indices') || '[]');
          var allApplied = cardIndices.every(function (idx) {
            return targetCard._appliedIndices && targetCard._appliedIndices.includes(idx);
          });

          // ✅ RELANCER LE SCAN après application pour mettre à jour le status BOUND
          // Délai de 200ms pour laisser Figma propager le changement
          setTimeout(function () {
            console.log('🔄 Relancement du scan après application du correctif...');
            parent.postMessage({
              pluginMessage: {
                type: 'start-scan'
              }
            }, '*');
          }, 200);

          // Plus d'animation de morphing - uniquement le slide-out propre
        }
      } else {
        // ✅ FIX: Amélioration du feedback d'échec
        showNotification('La correction n\'a pas pu être appliquée', 'warning');

        // Remettre la card à l'état normal en cas d'échec
        var cards = document.querySelectorAll('.cleaning-result-card, .compact-row');
        cards.forEach(function (card) {
          var cardIndices = JSON.parse(card.getAttribute('data-indices') || '[]');
          if (cardIndices.includes(index)) {
            // Animation d'avertissement (orange)
            card.style.transition = 'all 0.3s ease';
            card.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
            card.style.borderColor = 'rgb(245, 158, 11)';

            // Réactiver les boutons
            var buttons = card.querySelectorAll('button[data-action]');
            buttons.forEach(function (btn) { btn.disabled = false; });

            // Retour à la normale après 2s
            setTimeout(function () {
              card.style.backgroundColor = '';
              card.style.borderColor = '';
              card.style.transition = '';
            }, 2000);
          }
        });
      }
    }

    function handleGroupFixApplied(appliedCount, error, indices) {

      if (error) {
        console.error('[DEBUG handleGroupFixApplied] Erreur lors de l\'application du groupe:', error);
        showNotification('Erreur lors de l\'application du groupe de corrections', 'error');
        return;
      }

      if (appliedCount > 0 && indices && indices.length > 0) {
        // Trouver la carte correspondante aux indices du groupe
        var cards = document.querySelectorAll('.cleaning-result-card, .compact-row');
        var targetCard = null;

        cards.forEach(function (card) {
          var cardIndices = JSON.parse(card.getAttribute('data-indices') || '[]');
          // Vérifier si cette carte contient TOUS les indices du groupe
          var containsAllIndices = indices.every(function (index) {
            return cardIndices.includes(index);
          });
          if (containsAllIndices) {
            targetCard = card;
          }
        });

        if (targetCard) {
          // Vérifier si la carte n'a pas déjà été masquée par l'animation optimiste
          var alreadyHidden = targetCard.style.display === 'none';

          if (!alreadyHidden) {
            // Marquer tous les indices comme appliqués (local + global)
            if (!targetCard._appliedIndices) {
              targetCard._appliedIndices = [];
            }
            indices.forEach(function (index) {
              if (!targetCard._appliedIndices.includes(index)) {
                targetCard._appliedIndices.push(index);
              }
              // 🔥 CRITICAL: Ajouter aussi dans appliedResultIndices global pour le undo
              if (appliedResultIndices.indexOf(index) === -1) {
                appliedResultIndices.push(index);
              }
            });

            // ❌ SUPPRIMÉ : Mise à jour des compteurs pendant l'animation - Cause des animations parasites

            // Animation de succès pour le groupe (accélérée)
            targetCard.style.transition = 'all 0.15s ease';
            targetCard.style.backgroundColor = 'var(--poly-success-light)';
            targetCard.style.borderColor = 'var(--poly-success)';
          } else {
            // La carte a déjà été masquée par l'animation optimiste, juste mettre à jour les indices
            if (!targetCard._appliedIndices) {
              targetCard._appliedIndices = [];
            }
            indices.forEach(function (index) {
              if (!targetCard._appliedIndices.includes(index)) {
                targetCard._appliedIndices.push(index);
              }
              // 🔥 CRITICAL: Ajouter aussi dans appliedResultIndices global pour le undo
              if (appliedResultIndices.indexOf(index) === -1) {
                appliedResultIndices.push(index);
              }
            });
          }

          if (!alreadyHidden) {
            // Désactiver les contrôles
            var buttons = targetCard.querySelectorAll('button[data-action]');
            buttons.forEach(function (btn) { btn.disabled = true; });

            // Vérifier si toutes les corrections du groupe sont appliquées
            var cardIndices = JSON.parse(targetCard.getAttribute('data-indices') || '[]');
            var allApplied = cardIndices.every(function (idx) {
              return targetCard._appliedIndices && targetCard._appliedIndices.includes(idx);
            });

            if (allApplied) {
              // Récupérer les informations depuis les data-attributes
              var oldValue = targetCard.getAttribute('data-current-value') || '--';
              var newVariable = targetCard.getAttribute('data-variable-name') || '--';

              var variablePill = targetCard.querySelector('.variable-pill');

              // Stocker le HTML original du bouton pour la restauration
              var originalButtonHTML = variablePill ? variablePill.innerHTML : '';
              var originalButtonStyles = variablePill ? {
                background: variablePill.style.background,
                color: variablePill.style.color,
                transform: variablePill.style.transform,
                boxShadow: variablePill.style.boxShadow
              } : {};

              // MORPHING BUTTON : Transformer le bouton en checkmark
              if (variablePill) {
                variablePill._originalHTML = originalButtonHTML;
                variablePill._originalStyles = originalButtonStyles;

                variablePill.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                variablePill.innerHTML = '<span style="font-size: 18px; font-weight: bold;">✓</span>';
                variablePill.style.background = 'var(--poly-success)';
                variablePill.style.color = 'white';
                variablePill.style.transform = 'scale(1.08)';
                variablePill.style.boxShadow = '0 4px 12px rgba(138, 213, 63, 0.3)';
                variablePill.disabled = true;
              }


              // Attendre 300ms que le cerveau enregistre le succès
              setTimeout(function () {
                // Animation de succès sans faire disparaître la carte (accélérée)
                targetCard.style.transition = 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                targetCard.style.transform = 'scale(1.02)';
                targetCard.style.boxShadow = '0 8px 25px rgba(138, 213, 63, 0.15)';

                setTimeout(function () {
                  // Remettre la carte à son état normal sans la cacher
                  targetCard.style.transform = '';
                  targetCard.style.boxShadow = '';


                  // ❌ SUPPRIMÉ : updateProblemCounter() - Cause des animations parasites sur le compteur
                  // ❌ SUPPRIMÉ : updateDynamicTabCounts() - Cause des animations parasites
                  // ❌ SUPPRIMÉ : applyFilter() - Cause des animations parasites

                  // Plus de mise à jour d'interface pendant l'animation
                }, 200);
              }, 150);
            }
          }
        } else {
          console.warn('[DEBUG handleGroupFixApplied] Aucune carte trouvée pour les indices:', indices);
        }
      } else {
        showNotification('Les corrections de groupe n\'ont pas pu être appliquées', 'warning');
      }
    }

    function requestScanUpdate() {
      // Demander un nouveau scan pour mettre à jour l'UI
      parent.postMessage({ pluginMessage: { type: "scan-frame" } }, "*");
    }

    // ============================================
    // FONCTIONS EXISTANTES MODIFIÉES
    // ============================================

    function calculateCleaningStats(results) {
      if (results.length === 0) {
        return { total: 0, autoFixable: 0, manualFixes: 0, categories: {} };
      }

      var groups = groupResultsByValue(results);
      var autoFixable = 0;
      var manualFixes = 0;
      var categories = {};

      groups.forEach(function (group) {
        var isAutoFixable = group.suggestions.length === 1;

        if (isAutoFixable) {
          autoFixable += group.originalIndices.length; // Compter les éléments dans le groupe
        } else {
          manualFixes += group.originalIndices.length;
        }

        // Comptage par catégorie
        var category = (group.property === "Fill" || group.property === "Stroke" || group.property === "Local Fill Style" || group.property === "Local Stroke Style") ? "colors" : "geometry";
        if (!categories[category]) {
          categories[category] = { total: 0, auto: 0, manual: 0 };
        }
        categories[category].total += group.originalIndices.length;
        if (isAutoFixable) {
          categories[category].auto += group.originalIndices.length;
        } else {
          categories[category].manual += group.originalIndices.length;
        }
      });

      return {
        total: results.length,
        autoFixable: autoFixable,
        manualFixes: manualFixes,
        categories: categories
      };
    }

    function updateCleaningDashboard(stats) {
      // Supprimé l'affichage du nombre total d'erreurs
      // document.getElementById('totalIssues').textContent = stats.total;
      document.getElementById('autoFixable').textContent = stats.autoFixable;
      document.getElementById('manualFixes').textContent = stats.manualFixes;
    }

    function generateAutoCleaningContent(results, stats) {
      // ... (Garder la vérification stats.autoFixable === 0)
      if (stats.autoFixable === 0) {
        return '<div style="text-align: center; padding: 40px 20px; color: var(--poly-text-muted);"><p>🎉 Tout est propre !</p></div>';
      }

      var groups = groupResultsByValue(results);
      var html = '<div class="cleaning-cards-list">';

      groups.forEach(function (group) {
        // On prend les groupes à suggestion unique (Exacte OU Approx)
        if (group.suggestions.length !== 1) return;

        var suggestion = group.suggestions[0];

        // Début Carte
        html += '<div class="cleaning-result-card auto-fixable">';

        // --- COLONNE GAUCHE (Infos) ---
        html += '<div class="auto-card-content">';

        // Badge Propriété (ex: CORNER RADIUS)
        html += '<div class="property-badge">' + group.property + '</div>';

        // Ligne Transformation: "4px -> spacing-1 (4px)"
        html += '<div class="transformation-row">';
        // Valeur actuelle
        if (group.property === "Fill" || group.property === "Stroke" || group.property === "Local Fill Style" || group.property === "Local Stroke Style") {
          html += '<div class="mini-swatch" style="background-color: ' + group.value + ';"></div>';
          html += '<span>' + group.value + '</span>';
        } else {
          html += '<span>' + group.value + '</span>';
        }

        html += '<span class="trans-arrow">→</span>';
        html += '<span class="var-name">' + suggestion.name + '</span>';

        // Afficher la valeur réelle de la variable entre parenthèses pour confirmation
        // (Note: on suppose que value est proche, on l'affiche pour info)
        if (!suggestion.isExact) {
          html += '<span class="badge-approx">≈ Approx</span>';
        } else {
          html += '<span class="badge-exact">✓ Exact</span>';
        }
        html += '</div>'; // Fin transformation-row
        html += '</div>'; // Fin auto-card-content

        // --- COLONNE DROITE (Boutons) ---
        html += '<div class="auto-card-actions">';

        // Bouton Voir les calques
        html += '<button class="btn-see-layers" onclick="selectLayers([' + group.originalIndices.join(',') + '])" title="Voir ' + group.originalIndices.length + ' calque(s)">';
        html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        html += 'Voir les calques';
        html += '</button>';

        // Bouton Appliquer
        html += '<button class="btn-primary" onclick="applyGroupFix([' + group.originalIndices.join(',') + '], \'' + suggestion.id + '\')">';
        html += 'Appliquer';
        html += '</button>';

        html += '</div>'; // Fin auto-card-actions

        html += '</div>'; // Fin Card
      });

      html += '</div>';
      return html;
    }

    function generateManualCleaningContent(results, stats) {
      if (stats.manualFixes === 0) {
        return '<div style="text-align: center; padding: 40px 20px; color: var(--poly-text-muted);"><p>✅ Aucune correction manuelle requise !</p><p style="font-size: 12px; margin-top: 8px;">Toutes les valeurs correspondent exactement à vos variables.</p></div>';
      }

      var groups = groupResultsByValue(results);
      var html = '<div class="cleaning-cards-list">';

      groups.forEach(function (group) {
        if (group.suggestions.length === 1) return;

        // Début Carte
        html += '<div class="cleaning-result-card manual-fix">';

        // --- COLONNE GAUCHE (Infos) ---
        html += '<div class="manual-card-content">';

        // Badge Propriété (ex: CORNER RADIUS)
        html += '<div class="property-badge">' + group.property + '</div>';

        // Valeur actuelle
        html += '<div class="value-row">';
        if (group.property === "Fill" || group.property === "Stroke" || group.property === "Local Fill Style" || group.property === "Local Stroke Style") {
          html += '<div class="mini-swatch" style="background-color: ' + group.value + ';"></div>';
          html += '<span>' + group.value + '</span>';
        } else {
          html += '<span>' + group.value + '</span>';
        }
        html += '</div>';

        // Sélecteur de variable
        html += '<div class="variable-selector-row">';
        if (group.suggestions.length > 1) {
          // CUSTOM DROPDOWN POUR LES CONFLITS MANUELS (DÉSACTIVÉ AU DÉPART)
          html += generateCustomVariableSelector(group.suggestions, group.originalIndices, null, true); // true = disabled
        } else {
          html += '<div style="padding: 6px; background: var(--poly-surface-soft); border-radius: 6px; font-size: 12px; color: var(--poly-text-muted);">Variable suggérée : ' + group.suggestions[0].name + '</div>';
        }
        html += '</div>';

        html += '</div>'; // Fin manual-card-content

        // --- COLONNE DROITE (Boutons) ---
        html += '<div class="manual-card-actions">';

        // Bouton Voir les calques
        html += '<button class="btn-see-layers" onclick="selectLayers([' + group.originalIndices.join(',') + '])" title="Voir ' + group.originalIndices.length + ' calque(s)">';
        html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        html += 'Voir les calques';
        html += '</button>';

        // Bouton Appliquer (désactivé par défaut)
        html += '<button class="btn-primary manual-apply-btn" onclick="applyManualGroupFix([' + group.originalIndices.join(',') + '], this)" disabled>';
        html += 'Appliquer';
        html += '</button>';

        html += '</div>'; // Fin manual-card-actions';

        html += '</div>';
      });

      html += '</div>';
      return html;
    }

    function generateStatusContent(results, stats) {
      if (results.length === 0) {
        return '<div class="status-empty"><span>📈</span><p>Lancez une analyse pour voir l\'état de votre projet</p></div>';
      }

      var html = '<div style="display: grid; gap: 16px;">';

      // Résumé global
      html += '<div style="background: var(--poly-surface-soft); padding: 16px; border-radius: 8px; border: 1px solid var(--poly-border-subtle);">';
      html += '<h6 style="margin: 0 0 12px 0; color: var(--poly-text); font-size: 14px;">📊 Résumé du nettoyage</h6>';
      html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">';

      // Auto-corrigeable
      html += '<div style="text-align: center; padding: 12px; background: ' + (stats.autoFixable > 0 ? 'rgba(22, 163, 74, 0.1)' : 'var(--poly-surface)') + '; border-radius: 6px;">';
      html += '<div style="font-size: 18px; font-weight: 700; color: ' + (stats.autoFixable > 0 ? 'var(--poly-success)' : 'var(--poly-text-muted)') + ';">' + stats.autoFixable + '</div>';
      html += '<div style="font-size: 11px; color: var(--poly-text-muted);">Auto-corrigeables</div>';
      html += '</div>';

      // Manuel
      html += '<div style="text-align: center; padding: 12px; background: ' + (stats.manualFixes > 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--poly-surface)') + '; border-radius: 6px;">';
      html += '<div style="font-size: 18px; font-weight: 700; color: ' + (stats.manualFixes > 0 ? 'var(--poly-warning)' : 'var(--poly-text-muted)') + ';">' + stats.manualFixes + '</div>';
      html += '<div style="font-size: 11px; color: var(--poly-text-muted);">À corriger manuellement</div>';
      html += '</div>';

      html += '</div>';
      html += '</div>';

      // Détail par catégorie
      if (Object.keys(stats.categories).length > 0) {
        html += '<div style="background: var(--poly-surface-soft); padding: 16px; border-radius: 8px; border: 1px solid var(--poly-border-subtle);">';
        html += '<h6 style="margin: 0 0 12px 0; color: var(--poly-text); font-size: 14px;">🎨 Détail par catégorie</h6>';

        Object.keys(stats.categories).forEach(function (catKey) {
          var cat = stats.categories[catKey];
          var catName = catKey === 'colors' ? 'Couleurs' : 'Géométrie';
          var catIcon = catKey === 'colors' ? '🎨' : '📐';

          html += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--poly-border-subtle);">';
          html += '<div style="display: flex; align-items: center; gap: 8px;">';
          html += '<span>' + catIcon + '</span>';
          html += '<span style="font-weight: 500;">' + catName + '</span>';
          html += '</div>';
          html += '<div style="display: flex; gap: 12px; font-size: 12px;">';
          html += '<span style="color: var(--poly-success);">✓ ' + cat.auto + '</span>';
          html += '<span style="color: var(--poly-warning);">⚠️ ' + cat.manual + '</span>';
          html += '<span style="color: var(--poly-text-muted);">Total: ' + cat.total + '</span>';
          html += '</div>';
          html += '</div>';
        });

        html += '</div>';
      }

      html += '</div>';
      return html;
    }

    function toggleBulkActions(stats) {
      var autoActions = document.getElementById('autoCleaningActions');
      var manualActions = document.getElementById('manualCleaningActions');

      autoActions.style.display = stats.autoFixable > 0 ? 'block' : 'none';
      manualActions.style.display = stats.manualFixes > 0 ? 'block' : 'none';
    }

    function getPropertyIcon(property) {
      // Fonction helper pour créer des SVGs harmonisés
      function createHarmonizedSvg(svgPath, label) {
        return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">' + svgPath + '</svg><span class="property-label">' + label + '</span>';
      }

      // Normalisation pour gérer les enums uppercase de code.js
      var p = (property || '').toUpperCase();

      switch (p) {
        case 'FILL':
        case 'TEXT_FILL':
        case 'TEXT_FILL_COLOR':
          return createHarmonizedSvg('<path d="M9 9H15V15H9V9Z" fill="#90EE90"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8 7H16C16.2652 7 16.5196 7.10536 16.7071 7.29289C16.8946 7.48043 17 7.73478 17 8V16C17 16.2652 16.8946 16.5196 16.7071 16.7071C16.5196 16.8946 16.2652 17 16 17H8C7.73478 17 7.48043 16.8946 7.29289 16.7071C7.10536 16.5196 7 16.2652 7 16V8C7 7.73478 7.10536 7.48043 7.29289 7.29289C7.48043 7.10536 7.73478 7 8 7ZM6 8C6 7.46957 6.21071 6.96086 6.58579 6.58579C6.96086 6.21071 7.46957 6 8 6H16C16.5304 6 17.0391 6.21071 17.4142 6.58579C17.7893 6.96086 18 7.46957 18 8V16C18 16.5304 17.7893 17.0391 17.4142 17.4142C17.0391 17.7893 16.5304 18 16 18H8C7.46957 18 6.96086 17.7893 6.58579 17.4142C6.21071 17.0391 6 16.5304 6 16V8ZM9 15V9H15V15H9ZM8 8.5C8 8.36739 8.05268 8.24021 8.14645 8.14645C8.24021 8.24021 8.36739 8 8.5 8H15.5C15.6326 8 15.7598 8.05268 15.8536 8.14645C15.9473 8.24021 16 8.36739 16 8.5V15.5C16 15.6326 15.9473 15.7598 15.8536 15.8536C15.7598 15.9473 15.6326 16 15.5 16H8.5C8.36739 16 8.24021 15.9473 8.14645 15.8536C8.05268 15.7598 8 15.6326 8 15.5V8.5Z" fill="#90EE90"/>', 'FILL');
        case 'STROKE':
        case 'LOCAL STROKE STYLE':
        case 'LOCAL_STROKE_STYLE':
          return createHarmonizedSvg('<path d="M2.5 2.5H7.5V7.5H2.5V2.5Z" fill="none" stroke="#90EE90" stroke-width="1.5"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2 1.5H8C8.13261 1.5 8.25979 1.55268 8.35355 1.64645C8.44732 1.74021 8.5 1.86739 8.5 2V8C8.5 8.13261 8.44732 8.25979 8.35355 8.35355C8.25979 8.44732 8.13261 8.5 8 8.5H2C1.86739 8.5 1.74021 8.44732 1.64645 8.35355C1.55268 8.44732 1.5 8.13261 1.5 8V2C1.5 1.86739 1.55268 1.74021 1.64645 1.64645C1.74021 1.55268 1.86739 1.5 2 1.5ZM0.5 2C0.5 1.46957 0.710714 0.960859 1.08579 0.585786C1.46086 0.210714 1.96957 0 2.5 0H7.5C8.03043 0 8.53914 0.210714 8.91421 0.585786C9.28929 0.960859 9.5 1.46957 9.5 2V8C9.5 8.53043 9.28929 9.03914 8.91421 9.41421C8.53914 9.78929 8.03043 10 7.5 10H2.5C1.96957 10 1.46086 9.78929 1.08579 9.41421C0.710714 9.03914 0.5 8.53043 0.5 8V2Z" fill="none" stroke="#90EE90" stroke-width="1.5"/>', 'STROKE');
        case 'LOCAL FILL STYLE':
        case 'LOCAL_FILL_STYLE':
          return createHarmonizedSvg('<path d="M9 9H15V15H9V9Z" fill="#90EE90"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8 7H16C16.2652 7 16.5196 7.10536 16.7071 7.29289C16.8946 7.48043 17 7.73478 17 8V16C17 16.2652 16.8946 16.5196 16.7071 16.7071C16.5196 16.8946 16.2652 17 16 17H8C7.73478 17 7.48043 16.8946 7.29289 16.7071C7.10536 16.5196 7 16.2652 7 16V8C7 7.73478 7.10536 7.48043 7.29289 7.29289C7.48043 7.10536 7.73478 7 8 7ZM6 8C6 7.46957 6.21071 6.96086 6.58579 6.58579C6.96086 6.21071 7.46957 6 8 6H16C16.5304 6 17.0391 6.21071 17.4142 6.58579C17.7893 6.96086 18 7.46957 18 8V16C18 16.5304 17.7893 17.0391 17.4142 17.4142C17.0391 17.7893 16.5304 18 16 18H8C7.46957 18 6.96086 17.7893 6.58579 17.4142C6.21071 17.0391 6 16.5304 6 16V8Z" fill="#FFD700"/><text x="12" y="13" text-anchor="middle" fill="#000" font-size="6" font-weight="bold">S</text>', 'STYLE LOCAL');
        case 'FONT_SIZE':
        case 'FONT SIZE':
          return createHarmonizedSvg('<path d="M12.6317 16H11.6161L10.8114 13.7344H7.57703L6.77234 16H5.75671L8.69421 8H9.69421L12.6317 16ZM18.3563 16H17.3719L16.9501 14.7451H15.036L14.6151 16H13.6307L15.4227 10.9092H16.5614L18.3563 16ZM15.285 14.0039H16.701L16.0116 11.9531H15.9725L15.285 14.0039ZM7.88171 12.875H10.5067L9.22546 9.26562H9.16296L7.88171 12.875Z" fill="#90EE90"/>', 'Taille');
        case 'LINE_HEIGHT':
        case 'LINE HEIGHT':
          return createHarmonizedSvg('<path d="M3 7H21M3 12H21M3 17H21" stroke="#90EE90" stroke-width="2" stroke-linecap="round"/>', 'Interligne');
        case 'CORNER_RADIUS':
        case 'RADIUS':
        case 'TOP LEFT RADIUS':
        case 'TOP RIGHT RADIUS':
        case 'BOTTOM LEFT RADIUS':
        case 'BOTTOM RIGHT RADIUS':
          return createHarmonizedSvg('<path fill-rule="evenodd" clip-rule="evenodd" d="M8.89996 6H8.87996C8.47696 6 8.14496 6 7.87396 6.022C7.59396 6.045 7.33396 6.094 7.09196 6.218C6.71566 6.40974 6.40971 6.71569 6.21796 7.092C6.09396 7.335 6.04496 7.593 6.02196 7.874C5.99996 8.144 5.99996 8.477 5.99996 8.88V9.5C5.99996 9.63261 6.05264 9.75979 6.14641 9.85355C6.24018 9.94732 6.36736 10 6.49996 10C6.63257 10 6.75975 9.94732 6.85352 9.85355C6.94729 9.75979 6.99996 9.63261 6.99996 9.5V8.9C6.99996 8.472 6.99996 8.18 7.01896 7.956C7.03696 7.736 7.06896 7.624 7.10896 7.546C7.20484 7.35785 7.35781 7.20487 7.54596 7.109C7.62396 7.069 7.73596 7.037 7.95596 7.019C8.17996 7 8.47196 7 8.89996 7H9.49996C9.63257 7 9.75975 6.94732 9.85352 6.85355C9.94729 6.75979 9.99996 6.63261 9.99996 6.5C9.99996 6.36739 9.94729 6.24021 9.85352 6.14645C9.75975 6.05268 9.63257 6 9.49996 6H8.89996ZM15.1 6H15.12C15.523 6 15.855 6 16.126 6.022C16.407 6.045 16.666 6.094 16.908 6.218C17.2843 6.40974 17.5902 6.71569 17.782 7.092C17.906 7.335 17.955 7.593 17.978 7.874C18 8.144 18 8.477 18 8.879V9.5C18 9.63261 17.9473 9.75979 17.8535 9.85355C17.7597 9.94732 17.6326 10 17.5 10C17.3674 10 17.2402 9.94732 17.1464 9.85355C17.0526 9.75979 17 9.63261 17 9.5V8.9C17 8.472 17 8.18 16.981 7.956C16.963 7.736 16.931 7.624 16.891 7.546C16.7951 7.35785 16.6421 7.20487 16.454 7.109C16.376 7.069 16.264 7.037 16.044 7.019C15.7296 7.00117 15.4148 6.99483 15.1 7H14.5C14.3674 7 14.2402 6.94732 14.1464 6.85355C14.0526 6.75979 14 6.63261 14 6.5C14 6.36739 14.0526 6.24021 14.1464 6.14645C14.2402 6.05268 14.3674 6 14.5 6H15.1ZM15.12 18H14.5C14.3674 18 14.2402 17.9473 14.1464 17.8536C14.0526 17.7598 14 17.6326 14 17.5C14 17.3674 14.0526 17.2402 14.1464 17.1464C14.2402 17.0527 14 17 14.5 17H15.1C15.528 17 15.82 17 16.044 16.981C16.264 16.963 16.376 16.931 16.454 16.891C16.6421 16.7951 16.7951 16.6422 16.891 16.454C16.931 16.376 16.963 16.264 16.981 16.044C17 15.819 17 15.528 17 15.1V14.5C17 14.3674 17.0526 14.2402 17.1464 14.1464C17.2402 14.0527 17.3674 14 17.5 14C17.6326 14 17.7597 14.0527 17.8535 14.1464C17.9473 14.2402 18 14.3674 18 14.5V15.12C18 15.523 18 15.855 17.978 16.126C17.955 16.407 17.906 16.666 17.782 16.908C17.5902 17.2843 17.2843 17.5903 16.908 17.782C16.665 17.906 16.407 17.955 16.126 17.978C15.856 18 15.523 18 15.121 18H15.12ZM8.89996 18H8.87996C8.47696 18 8.14496 18 7.87396 17.978C7.59296 17.955 7.33396 17.906 7.09196 17.782C6.71566 17.5903 6.40971 17.2843 6.21796 16.908C6.09396 16.665 6.04496 16.407 6.02196 16.126C6.00199 15.7911 5.99465 15.4555 5.99996 15.12V14.5C5.99996 14.3674 6.05264 14.2402 6.14641 14.1464C6.24018 14.0527 6.36736 14 6.49996 14C6.63257 14 6.75975 14.0527 6.85352 14.1464C6.94729 14.2402 6.99996 14.3674 6.99996 14.5V15.1C6.99996 15.528 6.99996 15.82 7.01896 16.044C7.03696 16.264 7.06896 16.376 7.10896 16.454C7.20484 16.6422 7.35781 16.7951 7.54596 16.891C7.62396 16.931 7.73596 16.963 7.95596 16.981C8.18096 17 8.47196 17 8.89996 17H9.49996C9.63257 17 9.75975 17.0527 9.85352 17.1464C9.94729 17.2402 9.99996 17.3674 9.99996 17.5C9.99996 17.6326 9.94729 17.7598 9.85352 17.8536C9.75975 17.9473 9.63257 18 9.49996 18H8.89996Z" fill="#90EE90"/>', 'Arrondi');
        case 'GAP':
        case 'SPACING':
        case 'ITEM SPACING':
        case 'ITEM_SPACING':
          return createHarmonizedSvg('<path d="M7.5 7.5V7.75C7.5 8.164 7.836 8.5 8.25 8.5H14.75C14.9489 8.5 15.1397 8.42098 15.2803 8.28033C15.421 8.13968 15.5 7.94891 15.5 7.75V7.5M7.5 15.5V15.25C7.5 15.0511 7.57902 14.8603 7.71967 14.7197C7.86032 14.579 8.05109 14.5 8.25 14.5H14.75C14.9489 14.5 15.1397 14.579 15.2803 14.7197C15.421 14.8603 15.5 15.0511 15.5 15.25V15.5M9.5 11.5H13.5" stroke="#90EE90" stroke-linecap="round" stroke-linejoin="round"/>', 'GAP');
        case 'PADDING':
        case 'PADDING_TOP':
        case 'PADDING_BOTTOM':
        case 'PADDING_LEFT':
        case 'PADDING_RIGHT':
        case 'PADDING TOP':
        case 'PADDING BOTTOM':
        case 'PADDING LEFT':
        case 'PADDING RIGHT':
          return createHarmonizedSvg('<path fill-rule="evenodd" clip-rule="evenodd" d="M8 7.5C8 7.36739 7.94732 7.24021 7.85355 7.14645C7.75979 7.05268 7.63261 7 7.5 7C7.36739 7 7.24021 7.05268 7.14645 7.14645C7.05268 7.24021 7 7.36739 7 7.5V16.5C7 16.6326 7.05268 16.7598 7.14645 16.8536C7.24021 16.9473 7.36739 17 7.5 17C7.63261 17 7.75979 16.9473 7.85355 16.8536C7.94732 16.7598 8 16.6326 8 16.5V7.5ZM16.5 7C16.6326 7 16.7598 7.05268 16.8536 7.14645C16.9473 7.24021 17 7.36739 17 7.5V16.5C17 16.6326 16.9473 16.7598 16.8536 16.8536C16.7598 16.9473 16.6326 17 16.5 17C16.3674 17 16.2402 16.9473 16.1464 16.8536C16.0527 16.7598 16 16.6326 16 16.5V7.5C16 7.36739 16.0527 7.24021 16.1464 7.14645C16.2402 7.05268 16.3674 7 16.5 7ZM13 13V11H11V13H13ZM14 11C14 10.7348 13.8946 10.4804 13.7071 10.2929C13.5196 10.1054 13.2652 10 13 10H11C10.7348 10 10.4804 10.1054 10.2929 10.2929C10.1054 10.4804 10 10.7348 10 11V13C10 13.2652 10.1054 13.5196 10.2929 13.7071C10.4804 13.8946 10.7348 14 11 14H13C13.2652 14 13.5196 13.8946 13.7071 13.7071C13.8946 13.5196 14 13.2652 14 13V11Z" fill="#90EE90"/>', 'Marge');
        case 'STROKE_WEIGHT':
        case 'STROKE WEIGHT':
        case 'BORDER WIDTH':
        case 'BORDER_WIDTH':
          return createHarmonizedSvg('<path d="M4 12L20 12" stroke="#90EE90" stroke-width="4" stroke-linecap="round"/>', 'Bordure');
        default:
          return '<span class="property-label">' + (property || 'Propriété') + '</span>';
      }
    }

    // ============================================
    // GESTION DES FILTRES ET SÉLECTIONS
    // ============================================

    var currentFilter = 'auto';
    window.currentFilter = currentFilter; // Exposer globalement
    var selectedItems = new Set();

    // Initialisation du système      // Gérer la sélection des filtres (Tabs style)
    function initFilterSystem() {
      // Sélecteur large pour attraper les onglets quel que soit leur style (.tab ou .filter-btn)
      var filterButtons = document.querySelectorAll('.tab[data-filter], .filter-btn[data-filter]');

      filterButtons.forEach(function (btn) {
        // Cloner le bouton pour supprimer les écouteurs précédents
        var newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', function () {
          // Gestion de l'état actif UI
          document.querySelectorAll('.tab[data-filter], .filter-btn[data-filter]').forEach(function (b) {
            b.classList.remove('active');
          });
          this.classList.add('active');

          // Application du filtre
          currentFilter = this.getAttribute('data-filter');
          console.log('APPLYFILTER appelé depuis bouton filtre:', currentFilter);
          applyFilter(currentFilter);

          // Mettre à jour les pastilles des onglets après changement de filtre
          updateDynamicTabCounts();
        });
      });
    }

    // ✅ MISE À JOUR DU CONTENU DU HEADER SELON L'ONGLET
    function updateFilterContent(filterType) {
      var titleElement = document.getElementById('scanInfoTitle');
      var descriptionElement = document.getElementById('scanInfoDescription');

      if (!titleElement || !descriptionElement) return;

      if (filterType === 'auto') {
        titleElement.textContent = 'Corrections automatiques';
        descriptionElement.textContent = 'PolyToken a trouvé des correspondances exactes. Vous pouvez remplacer les valeurs par vos tokens en un clic sans risque.';
      } else if (filterType === 'manual') {
        titleElement.textContent = 'Corrections manuelles';
        descriptionElement.textContent = 'Plusieurs tokens correspondent. Choisissez celui qui convient le mieux pour chaque élément.';
      }
    }

    // ✅ FIX DES FILTRES (ONGLETS)
    function applyFilter(filterType) {
      console.log('=== APPLYFILTER DÉBUT === filterType:', filterType, 'ignoredCardSignatures:', ignoredCardSignatures);

      currentFilter = filterType;

      // Mettre à jour le contenu du header
      updateFilterContent(filterType);

      var cards = document.querySelectorAll('.cleaning-result-card');
      console.log('Cartes trouvées dans le DOM:', cards.length);
      var visibleCount = 0;

      cards.forEach(function (card) {
        // Si la carte a été marquée ignorée manuellement, elle doit le rester peu importe le filtre
        if (card.classList.contains('is-ignored-permanently')) {
          console.log('Carte ignorée définitivement détectée et masquée:', card.getAttribute('data-indices'));
          card.style.display = 'none';
          return; // Stop, on ne traite pas cette carte
        }

        // 2. VÉRIFICATION INDICES (Ceinture et bretelles) - UNIQUEMENT pour les ignorés, PAS les appliqués
        var cardIndices = card.getAttribute('data-indices');
        if (cardIndices) {
          try {
            var indices = JSON.parse(cardIndices.replace(/&quot;/g, '"'));
            // Vérifier si un des indices est dans la liste globale ignorée (PAS appliedResultIndices)
            var isIgnoredGlobally = indices.some(function (i) { return ignoredResultIndices.indexOf(i) !== -1; });
            if (isIgnoredGlobally) {
              card.classList.add('is-ignored-permanently'); // Synchroniser la classe
              card.style.display = 'none';
              return;
            }
          } catch (e) { }
        }


        // Logique simplifiée basée sur les classes CSS (plus robuste)
        var isVisible = false;

        if (filterType === 'auto') {
          isVisible = card.classList.contains('auto-fixable');
        } else if (filterType === 'manual') {
          isVisible = card.classList.contains('manual-required') || card.classList.contains('manual-fix');
        } else {
          isVisible = true; // 'all'
        }

        // Respecter les cartes ignorées en vérifiant la signature
        var cardIndices = card.getAttribute('data-indices');
        if (cardIndices) {
          try {
            var indices = JSON.parse(cardIndices.replace(/&quot;/g, '"'));
            var cardSignature = 'card_' + indices.sort().join('_');
            var isIgnored = ignoredCardSignatures.indexOf(cardSignature) !== -1;
            if (isIgnored) {
              isVisible = false;
              console.log('Carte ignorée détectée par signature et gardée masquée:', cardSignature);
            }
          } catch (e) {
            console.error('Erreur parsing indices de carte:', cardIndices, e);
          }
        }

        card.style.display = isVisible ? 'flex' : 'none';
        console.log('Carte', card.getAttribute('data-indices'), '-> display:', card.style.display, 'isVisible:', isVisible);
        if (isVisible) visibleCount++;
      });

      console.log('=== APPLYFILTER FIN === visibleCount:', visibleCount, 'sur', cards.length, 'cartes');

      // Vérifier après un court délai si les cartes ignorées sont encore masquées
      setTimeout(function () {
        var stillHiddenCards = document.querySelectorAll('.cleaning-result-card[style*="display: none"]');
        console.log('Cartes encore masquées après délai:', stillHiddenCards.length);
        var ignoredStillHidden = 0;
        stillHiddenCards.forEach(function (card) {
          var cardIndices = card.getAttribute('data-indices');
          if (cardIndices) {
            try {
              var indices = JSON.parse(cardIndices.replace(/&quot;/g, '"'));
              var isIgnored = indices.some(function (index) {
                return ignoredResultIndices.indexOf(index) !== -1;
              });
              if (isIgnored) ignoredStillHidden++;
            } catch (e) { }
          }
        });
        console.log('Cartes ignorées encore masquées:', ignoredStillHidden);
      }, 100);

      // Gestion de l'état vide filtré
      var filteredEmptyState = document.getElementById('filteredEmptyState');
      var unifiedList = document.getElementById('unifiedCleaningList');

      if (visibleCount === 0 && cards.length > 0) {
        if (filteredEmptyState) filteredEmptyState.style.display = 'block';
        if (unifiedList) unifiedList.style.display = 'none';
      } else {
        if (filteredEmptyState) filteredEmptyState.style.display = 'none';
        if (unifiedList) unifiedList.style.display = 'block';
      }


      // Gestion de la visibilité du bouton selon l'onglet et présence d'éléments
      var applyAllAutoBtn = document.getElementById('applyAllAutoBtn');
      // Gestion de la visibilité du bouton selon l'onglet et présence d'éléments
      var applyAllAutoBtn = document.getElementById('applyAllAutoBtn');
      if (applyAllAutoBtn) {
        if (filterType === 'auto' && visibleCount > 0) {
          applyAllAutoBtn.style.display = 'flex';
        } else {
          applyAllAutoBtn.style.display = 'none';
        }
      }
    }

    // Déterminer si une carte doit être affichée selon le filtre
    function shouldShowCard(card, filterType) {
      var result = card._resultData;
      if (!result) return true;

      // Obtenir les suggestions (color ou numeric)
      var suggestions = result.colorSuggestions || result.numericSuggestions || [];
      var hasVariable = !!result.suggestedVariableId;

      switch (filterType) {
        case 'auto':
          // Correction automatique : a une variable suggérée ET 0 ou 1 suggestion
          return hasVariable && suggestions.length <= 1;
        case 'manual':
          // Correction manuelle : plusieurs suggestions OU pas de variable suggérée
          return suggestions.length > 1 || !hasVariable;
        default:
          return true;
      }
    }


    // Sélectionner tous les éléments visibles
    function selectAllVisibleItems() {
      var visibleCards = document.querySelectorAll('.cleaning-result-card[style*="display: flex"]');
      visibleCards.forEach(function (card) {
        var checkbox = card.querySelector('.item-checkbox');
        if (checkbox && !checkbox.checked) {
          checkbox.checked = true;
          handleItemSelection(card, true);
        }
      });
      updateBulkActions();
    }

    // Désélectionner tous les éléments
    function clearAllSelections() {
      selectedItems.clear();
      var checkboxes = document.querySelectorAll('.item-checkbox');
      checkboxes.forEach(function (checkbox) {
        checkbox.checked = false;
      });
      updateBulkActions();
    }

    // Gérer la sélection d'un élément individuel
    function handleItemSelection(card, isSelected) {
      var index = parseInt(card.getAttribute('data-index'));
      if (isSelected) {
        selectedItems.add(index);
      } else {
        selectedItems.delete(index);
      }
      updateBulkActions();
    }

    // Mettre à jour l'affichage des actions groupées
    function updateBulkActions() {
      var bulkActions = document.getElementById('bulkActions');
      var selectedCount = document.getElementById('selectedCount');
      var applyCount = document.getElementById('applyCount');
      var ignoreCount = document.getElementById('ignoreCount');
      var applyBtn = document.getElementById('applySelectedBtn');
      var ignoreBtn = document.getElementById('ignoreSelectedBtn');
      var progressFill = document.getElementById('progressFill');

      var count = selectedItems.size;

      if (count > 0) {
        bulkActions.style.display = 'block';
        selectedCount.textContent = count;
        applyCount.textContent = '(' + count + ')';
        ignoreCount.textContent = '(' + count + ')';
        applyBtn.disabled = false;
        ignoreBtn.disabled = false;

        // Calculer le pourcentage de progression
        var totalCards = document.querySelectorAll('.cleaning-result-card').length;
        var progressPercent = totalCards > 0 ? (count / totalCards) * 100 : 0;
        progressFill.style.width = progressPercent + '%';
      } else {
        bulkActions.style.display = 'none';
      }
    }

    // Appliquer les éléments sélectionnés
    // Appliquer les éléments sélectionnés - VERSION OPTIMISTE
    function applySelectedItems() {
      if (selectedItems.size === 0) return;

      var applyBtn = document.getElementById('applySelectedBtn');
      var initialLabel = applyBtn.innerHTML;

      // Feedback visuel immédiat sur le bouton (sans spinner bloquant)
      applyBtn.innerHTML = '⚡ Application...';

      var appliedCount = 0;

      // 1. Appliquer les corrections et MASQUER les cartes immédiatement (Optimistic UI)
      selectedItems.forEach(function (index) {
        var card = document.querySelector('.cleaning-result-card[data-index="' + index + '"]');
        if (card) {
          // Animation de sortie fluide
          card.style.transition = 'all 0.3s ease';
          card.style.opacity = '0';
          card.style.transform = 'translateX(20px)';

          setTimeout(function () {
            card.style.display = 'none';
            // Mettre à jour le compteur global sans re-scan
            updateProblemCounter(-1);
          }, 300);

          // Lancer le fix réel
          applySingleFix(index);
          appliedCount++;
        }
      });

      // 2. Notification de succès immédiate
      figma.notify('✅ ' + appliedCount + ' corrections appliquées');

      // 3. Reset UI immédiat
      applyBtn.innerHTML = initialLabel;
      clearAllSelections();

      // Note : On ne relance PAS le scan complet ici. 
      // On fait confiance à l'action. Le scan se fera si l'utilisateur le demande explicitement
      // ou change de sélection Figma.
    }

    // Ignorer les éléments sélectionnés
    function ignoreSelectedItems() {
      selectedItems.forEach(function (index) {
        var card = document.querySelector('.cleaning-result-card[data-index="' + index + '"]');
        if (card) {
          card.style.display = 'none';
          updateProblemCounter(-1);
        }
      });

      clearAllSelections();
      figma.notify('👁️ ' + selectedItems.size + ' élément(s) ignoré(s)');
    }

    // Afficher l'aide contextuelle
    function showHelpTooltip() {
      var helpHtml = '<div style="background: var(--poly-surface); padding: 20px; border-radius: 8px; border: 1px solid var(--poly-border-subtle); max-width: 400px;">';
      helpHtml += '<h4 style="margin-bottom: 12px; color: var(--poly-text);">Comment utiliser l\'analyse intelligente</h4>';
      helpHtml += '<ul style="margin: 0; padding-left: 20px; color: var(--poly-text-muted); line-height: 1.5;">';
      helpHtml += '<li>Sélectionnez une frame dans Figma</li>';
      helpHtml += '<li>Cliquez sur "Lancer l\'analyse"</li>';
      helpHtml += '<li>Utilisez les filtres pour voir les corrections</li>';
      helpHtml += '<li>Sélectionnez et appliquez les changements</li>';
      helpHtml += '</ul>';
      helpHtml += '<button onclick="this.parentElement.style.display=\'none\'" style="margin-top: 16px; padding: 8px 16px; background: var(--poly-accent); color: white; border: none; border-radius: 4px; cursor: pointer;">Compris</button>';
      helpHtml += '</div>';

      var helpContainer = document.createElement('div');
      helpContainer.innerHTML = helpHtml;
      helpContainer.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: rgba(0,0,0,0.5); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;';
      helpContainer.addEventListener('click', function (e) {
        if (e.target === this) {
          this.style.display = 'none';
        }
      });

      document.body.appendChild(helpContainer);
    }

    // Afficher l'état de chargement pendant l'analyse
    // NOUVEAU: Afficher le skeleton loading
    function showSkeleton() {
      var unifiedList = document.getElementById('unifiedCleaningList');
      if (!unifiedList) return;

      // Générer 5 cartes skeleton
      var skeletonHTML = '';
      for (var i = 0; i < 5; i++) {
        skeletonHTML += '<div class="skeleton-card">';
        skeletonHTML += '  <div class="skeleton-line" style="width: 60%;"></div>';
        skeletonHTML += '  <div class="skeleton-line" style="width: 80%;"></div>';
        skeletonHTML += '  <div class="skeleton-line" style="width: 40%;"></div>';
        skeletonHTML += '</div>';
      }

      unifiedList.innerHTML = skeletonHTML;
    }

    // 🛡️ STATE MANAGEMENT : Protection contre les boucles et états instables
    var scanWatchdogTimer = null;
    var isScanning = false;

    function showScanLoading() {
      // Protection: Ne pas relancer si déjà en cours (sauf si forcé)
      if (isScanning) {
        return;
      }

      isScanning = true;
      var scanEmptyState = document.getElementById('scanEmptyState');
      var scanResults = document.getElementById('scanResults');

      // Masquer l'état vide
      if (scanEmptyState) {
        scanEmptyState.classList.add('hidden');
        scanEmptyState.style.display = 'none';
      }

      // Afficher scanResults avec les skeletons
      if (scanResults) {
        scanResults.classList.remove('hidden');
        scanResults.style.display = 'flex';

        // Injecter les skeletons dans la liste
        var unifiedList = document.getElementById('unifiedCleaningList');
        if (unifiedList) {
          unifiedList.innerHTML = `
            <div class="cleaning-result-card skeleton" style="display: flex; flex-direction: column; padding: 12px 16px; margin-bottom: 8px; background: var(--poly-surface); border: 1px solid var(--poly-border-subtle); border-radius: 12px;">
              <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div class="skeleton-line" style="width: 16px; height: 16px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                  <div class="skeleton-line" style="width: 60px; height: 12px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                </div>
                <div style="display: flex; gap: 6px;">
                  <div class="skeleton-line" style="width: 28px; height: 28px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                  <div class="skeleton-line" style="width: 28px; height: 28px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                  <div class="skeleton-line" style="width: 28px; height: 28px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                </div>
              </div>
              <div class="card-body" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="skeleton-line" style="width: 20px; height: 20px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                  <div style="display: flex; flex-direction: column;">
                    <div class="skeleton-line" style="width: 80px; height: 11px; background: var(--poly-border-subtle); border-radius: 4px; margin-bottom: 2px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                    <div class="skeleton-line" style="width: 50px; height: 10px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="color: var(--poly-text-muted); flex-shrink: 0;">⟶</div>
                  <div style="display: flex; align-items: center;">
                    <div class="skeleton-line" style="width: 20px; height: 20px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                    <div style="display: flex; flex-direction: column; margin-left: 4px;">
                      <div class="skeleton-line" style="width: 70px; height: 12px; background: var(--poly-border-subtle); border-radius: 4px; margin-bottom: 2px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                      <div class="skeleton-line" style="width: 60px; height: 10px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="cleaning-result-card skeleton" style="display: flex; flex-direction: column; padding: 12px 16px; margin-bottom: 8px; background: var(--poly-surface); border: 1px solid var(--poly-border-subtle); border-radius: 12px;">
              <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div class="skeleton-line" style="width: 16px; height: 16px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                  <div class="skeleton-line" style="width: 55px; height: 12px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                </div>
                <div style="display: flex; gap: 6px;">
                  <div class="skeleton-line" style="width: 28px; height: 28px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                  <div class="skeleton-line" style="width: 28px; height: 28px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                  <div class="skeleton-line" style="width: 28px; height: 28px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                </div>
              </div>
              <div class="card-body" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="skeleton-line" style="width: 20px; height: 20px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                  <div style="display: flex; flex-direction: column;">
                    <div class="skeleton-line" style="width: 75px; height: 11px; background: var(--poly-border-subtle); border-radius: 4px; margin-bottom: 2px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                    <div class="skeleton-line" style="width: 45px; height: 10px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="color: var(--poly-text-muted); flex-shrink: 0;">⟶</div>
                  <div style="display: flex; align-items: center;">
                    <div class="skeleton-line" style="width: 20px; height: 20px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                    <div style="display: flex; flex-direction: column; margin-left: 4px;">
                      <div class="skeleton-line" style="width: 65px; height: 12px; background: var(--poly-border-subtle); border-radius: 4px; margin-bottom: 2px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                      <div class="skeleton-line" style="width: 55px; height: 10px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.1s;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="cleaning-result-card skeleton" style="display: flex; flex-direction: column; padding: 12px 16px; margin-bottom: 8px; background: var(--poly-surface); border: 1px solid var(--poly-border-subtle); border-radius: 12px;">
              <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div class="skeleton-line" style="width: 16px; height: 16px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                  <div class="skeleton-line" style="width: 70px; height: 12px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                </div>
                <div style="display: flex; gap: 6px;">
                  <div class="skeleton-line" style="width: 28px; height: 28px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                  <div class="skeleton-line" style="width: 28px; height: 28px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                  <div class="skeleton-line" style="width: 28px; height: 28px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                </div>
              </div>
              <div class="card-body" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="skeleton-line" style="width: 20px; height: 20px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                  <div style="display: flex; flex-direction: column;">
                    <div class="skeleton-line" style="width: 85px; height: 11px; background: var(--poly-border-subtle); border-radius: 4px; margin-bottom: 2px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                    <div class="skeleton-line" style="width: 40px; height: 10px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="color: var(--poly-text-muted); flex-shrink: 0;">⟶</div>
                  <div style="display: flex; align-items: center;">
                    <div class="skeleton-line" style="width: 20px; height: 20px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                    <div style="display: flex; flex-direction: column; margin-left: 4px;">
                      <div class="skeleton-line" style="width: 75px; height: 12px; background: var(--poly-border-subtle); border-radius: 4px; margin-bottom: 2px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                      <div class="skeleton-line" style="width: 65px; height: 10px; background: var(--poly-border-subtle); border-radius: 4px; animation: skeletonPulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;

          // Désactiver le bouton pendant le chargement
          var applyBtn = document.getElementById('applyAllAutoBtn');
          if (applyBtn) {
            applyBtn.disabled = true;
            applyBtn.style.opacity = '0.6';
            applyBtn.style.cursor = 'not-allowed';
            applyBtn.textContent = '🔍 Analyse en cours...';
          }
        }
      }

      // 🛡️ WATCHDOG TIMER : Si pas de réponse dans 8s, on libère
      if (scanWatchdogTimer) clearTimeout(scanWatchdogTimer);

      scanWatchdogTimer = setTimeout(function () {
        console.warn("🐶 Watchdog: Scan timeout (8s). Reset.");
        hideScanLoading();
        isScanning = false;
        if (unifiedList) {
          unifiedList.innerHTML = '<div class="empty-state-enhanced"><div class="empty-icon">⚠️</div><h3>Délai dépassé</h3><p>Le scan a été interrompu. Essayez une sélection plus petite.</p></div>';
        }
      }, 8000);
    }

    function hideScanLoading() {
      isScanning = false;

      // nettoyage watchdog
      if (scanWatchdogTimer) {
        clearTimeout(scanWatchdogTimer);
        scanWatchdogTimer = null;
      }

      // On ne cache pas scanResults ici, car on veut afficher le contenu réel
      // La responsabilité de masquer le loading visuel est implicite (skeleton remplacé par contenu)
    }

    // Fonction pour mettre à jour le bouton principal selon l'onglet actif
    function updateMainActionButton(activeTab) {
      var scanBtn = document.getElementById('scanBtn');
      if (!scanBtn) return;

      // Supprimer les anciens event listeners
      scanBtn.onclick = null;

      if (activeTab === 'auto') {
        scanBtn.textContent = '✅ Terminer le nettoyage (Auto)';
        scanBtn.onclick = function () {
          applyAllAutoFixes();
        };
      } else if (activeTab === 'manual') {
        scanBtn.textContent = '✨ Terminer le nettoyage (Manuel)';
        scanBtn.onclick = function () {
          applyAllManualFixes();
        };
      }
    }

    // Gestionnaire pour les sélecteurs (Manuel & Auto avec Dropdown)
    function initVariableSelectors() {
      // Use event delegation for better performance and dynamic content support
      document.addEventListener('change', function (e) {
        // Cible : soit .manual-select soit .variable-selector (standard)
        if (e.target.classList.contains('manual-select') || e.target.classList.contains('variable-selector')) {
          var select = e.target;
          var variableId = select.value;
          var card = select.closest('.cleaning-result-card') || select.closest('.scan-result-card');
          if (!card) return;


          var select = e.target;
          var variableId = select.value;
          var card = select.closest('.cleaning-result-card') || select.closest('.scan-result-card');
          if (!card) return;

          // Récupérer les boutons de validation
          var applyBtn = card.querySelector('.manual-apply-btn') || card.querySelector('button[data-action="apply"]');

          // Récupérer les indices concernés
          var indicesRaw = select.getAttribute('data-indices') || select.getAttribute('data-index');
          var indices = [];
          if (select.hasAttribute('data-indices')) {
            indices = indicesRaw.split(',').map(Number);
          } else if (select.hasAttribute('data-index')) {
            indices = [parseInt(indicesRaw)];
          }

          if (variableId) {
            // 1. Stocker l'ID sélectionné sur la carte pour usage futur (Validation)
            card._selectedVariableId = variableId;
            select.setAttribute('data-selected', variableId);

            // 2. Activer le bouton de validation (Etat : Prêt à valider)
            if (applyBtn) {
              applyBtn.disabled = false;
              // Si c'est un bouton "manuel", changer son texte peut-être ?
              // applyBtn.classList.add('ready'); 
            }
            card.classList.add('ready-to-apply');

            // 3. ✨ PREVIEW : Envoyer le message de prévisualisation
            sendPreviewFix(indices, variableId);

            // Mise à jour des boutons globaux si c'est du manuel
            if (e.target.classList.contains('manual-select')) {
              updateManualApplyButton();
            }

          } else {
            // Cas où on désélectionne (si possible)
            if (applyBtn) applyBtn.disabled = true;
            card.classList.remove('ready-to-apply');
            if (e.target.classList.contains('manual-select')) {
              updateManualApplyButton();
            }
          }
        }
      });
    }

    // ============================================
    // CUSTOM DROPDOWN SYSTEM FOR VARIABLE SELECTORS
    // ============================================

    // Gestionnaire de clic pour les Smart Pills (preview + sélection)
    function handleSmartPillClick(buttonElement, indices, variableId, variableName, variableValue) {
      console.log('[UI] handleSmartPillClick called!', {
        indices: indices,
        variableId: variableId,
        variableName: variableName
      });

      // Utiliser le gestionnaire UI unifié
      if (typeof UIManager !== 'undefined' && UIManager.handleSmartPillClick) {
        UIManager.handleSmartPillClick(buttonElement, indices, variableId, variableName, variableValue);
      } else {
        // Fallback vers l'ancienne implémentation si les modules ne sont pas chargés
        var card = buttonElement.closest('.cleaning-result-card');

        sendPreviewFix(indices, variableId);

        card.setAttribute('data-selected-variable', variableId);
        card._selectedVariableId = variableId;

        var applyBtn = card.querySelector('button[data-action="apply"]');
        if (applyBtn) {
          applyBtn.disabled = false;
          applyBtn.classList.remove('btn-outline');
          applyBtn.classList.add('btn-primary');
          applyBtn.title = 'Appliquer ' + variableName;
        }

        var pillRow = buttonElement.closest('.smart-suggestions-row');
        pillRow.querySelectorAll('.smart-pill').forEach(function (pill) {
          pill.classList.remove('selected');
        });
        buttonElement.classList.add('selected');
      }
    }

    // ✅ EXPOSER LA FONCTION GLOBALEMENT pour les onclick inline
    window.handleSmartPillClick = handleSmartPillClick;

    // Nouvelle fonction pour les Smart Contextual Pills
    function renderSmartSuggestions(suggestions, property, indices) {
      // Utiliser le gestionnaire UI unifié
      if (typeof UIManager !== 'undefined' && UIManager.renderSmartSuggestions) {
        return UIManager.renderSmartSuggestions(suggestions, property, indices);
      } else {
        // Fallback vers l'ancienne implémentation si les modules ne sont pas chargés
        var html = '<div class="smart-suggestions-row">';

        var displayLimit = 3;
        var visibleSuggestions = suggestions.slice(0, displayLimit);

        visibleSuggestions.forEach(function (s) {
          var visualContent = '';
          var pillClass = 'smart-pill';

          // ✅ AMÉLIORATION: Ajouter un badge de distance pour les suggestions approximatives
          var distanceBadge = '';
          if (s.distance !== undefined && s.distance > 0) {
            var distanceLevel = s.distance < 50 ? 'excellent' : s.distance < 100 ? 'good' : s.distance < 150 ? 'fair' : 'distant';
            var distanceEmoji = s.distance < 50 ? '🎯' : s.distance < 100 ? '✅' : s.distance < 150 ? '⚠️' : '📍';
            distanceBadge = '<span class="distance-badge distance-' + distanceLevel + '" title="Distance: ' + Math.round(s.distance) + '">' + distanceEmoji + '</span>';
          }

          if (property === 'Fill' || property === 'Stroke' || property === 'Local Fill Style' || property === 'Local Stroke Style' || property === 'Text' || property === 'Text Fill') {
            var color = s.hex || s.value;
            visualContent = '<div class="pill-swatch" style="background-color: ' + color + '"></div>';
            pillClass += ' pill-color';
          } else if (property === 'Font Size') {
            var size = parseFloat(s.value);
            visualContent = '<span class="pill-preview-text" style="font-size: ' + Math.min(size, 20) + 'px">Ag</span>';
            pillClass += ' pill-typo';
          } else {
            visualContent = '<span class="pill-icon">📏</span>';
            pillClass += ' pill-metric';
          }

          // Convert to string before calling .replace() to handle numeric values
          var resolvedValueStr = String(s.resolvedValue || s.value);
          var nameStr = String(s.name);

          html += '<button class="' + pillClass + '" ' +
            'data-indices=\'' + JSON.stringify(indices) + '\' ' +
            'onclick="handleSmartPillClick(this, ' + JSON.stringify(indices) + ', \'' + s.id + '\', \'' + nameStr.replace(/'/g, "\\'") + '\', \'' + resolvedValueStr.replace(/'/g, "\\'") + '\')" ' +
            'title="' + s.name + ' (' + s.value + ')' + (s.distance ? ' - Distance: ' + Math.round(s.distance) : '') + '">' +
            visualContent +
            '<div class="pill-info">' +
            '<span class="pill-name">' + s.name + distanceBadge + '</span>' +
            '<span class="pill-value">' + (s.resolvedValue || s.value) + '</span>' +
            '</div>' +
            '</button>';
        });

        if (suggestions.length > displayLimit) {
          html += '<button class="smart-pill pill-more" onclick="toggleCustomDropdown(event.target.closest(\'.cleaning-result-card\').querySelector(\'.custom-select-container\'))">' +
            '+' + (suggestions.length - displayLimit) +
            '</button>';
        }

        html += '</div>';
        return html;
      }
    }

    function generateCustomVariableSelector(suggestions, indices, selectedVariableId, disabled) {
      var indicesJson = JSON.stringify(indices);
      var suggestionsJson = JSON.stringify(suggestions);
      var containerId = 'custom-select-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      var disabledClass = disabled ? ' disabled' : '';
      var disabledStyle = disabled ? ' opacity: 0.6; pointer-events: none;' : '';

      var html = '<div class="custom-select-container variable-selector-dropdown' + disabledClass + '" id="' + containerId + '" data-indices="' + indicesJson + '" data-suggestions="' + suggestionsJson.replace(/"/g, '&quot;') + '" style="' + disabledStyle + '">';

      // Trigger (bouton principal)
      var triggerLabel = disabled ? 'Analyse requise' : 'Choisir une variable...';
      html += '<div class="select-trigger">';
      html += '<div class="selected-label">' + triggerLabel + '</div>';
      html += '<div class="live-preview-indicator" style="display: none; color: var(--poly-accent); font-size: 10px; margin-right: 6px;">Live</div>';
      html += '<div class="chevron">▼</div>';
      html += '</div>';

      // Options container
      html += '<div class="select-options">';

      suggestions.forEach(function (s, index) {
        var valDisplay = s.hex || s.value || '';
        var displayText = s.name + (valDisplay ? ' (' + valDisplay + ')' : '');
        var variableValue = s.hex || s.value || '';

        html += '<div class="option-item" data-variable-id="' + s.id + '" data-variable-name="' + s.name.replace(/"/g, '&quot;') + '" data-variable-value="' + variableValue + '">';

        // Pour les couleurs, afficher un swatch
        if (s.hex) {
          html += '<div class="option-row">';
          html += '<div class="swatch" style="background-color: ' + s.hex + ';"></div>';
          html += '<div class="name">' + s.name + '</div>';
          html += '<div class="value">' + s.hex + '</div>';
          html += '</div>';
        } else {
          html += '<div class="option-row">';
          html += '<div class="name" style="grid-column: 2 / span 2;">' + displayText + '</div>';
          html += '</div>';
        }

        html += '</div>';
      });

      html += '</div>'; // Fin select-options
      html += '</div>'; // Fin custom-select-container

      return html;
    }

    function updateCustomDropdownTrigger(container, selectedSuggestion) {
      var trigger = container.querySelector('.select-trigger');
      var label = trigger.querySelector('.selected-label');
      var liveIndicator = trigger.querySelector('.live-preview-indicator');

      if (selectedSuggestion) {
        var valDisplay = selectedSuggestion.hex || selectedSuggestion.value || '';
        var displayText = selectedSuggestion.name + (valDisplay ? ' (' + valDisplay + ')' : '');

        label.textContent = displayText;

        // Montrer l'indicateur de live preview
        if (liveIndicator) {
          liveIndicator.style.display = 'block';
        }

        // Ajouter un color dot si c'est une couleur
        if (selectedSuggestion.hex) {
          // Supprimer l'ancien color dot s'il existe
          var existingDot = trigger.querySelector('.color-dot');
          if (existingDot) existingDot.remove();

          var colorDot = document.createElement('div');
          colorDot.className = 'color-dot';
          colorDot.style.backgroundColor = selectedSuggestion.hex;
          trigger.insertBefore(colorDot, label);
        }
      } else {
        label.textContent = 'Choisir une variable...';
        if (liveIndicator) {
          liveIndicator.style.display = 'none';
        }
        var existingDot = trigger.querySelector('.color-dot');
        if (existingDot) existingDot.remove();
      }
    }

    function initCustomDropdowns() {
      document.addEventListener('click', function (e) {

        var trigger = e.target.closest('.select-trigger');
        if (trigger) {
          var container = trigger.closest('.custom-select-container');
          toggleCustomDropdown(container);
          e.stopPropagation();
          return;
        }

        var option = e.target.closest('.option-item');
        if (option) {
          var container = option.closest('.custom-select-container');
          var variableId = option.getAttribute('data-variable-id');
          var variableName = option.getAttribute('data-variable-name');
          var indices = JSON.parse(container.getAttribute('data-indices') || '[]');


          // Trouver la suggestion sélectionnée directement depuis les attributs
          var selectedSuggestion = {
            id: variableId,
            name: variableName,
            hex: option.getAttribute('data-variable-value').startsWith('#') ? option.getAttribute('data-variable-value') : null,
            value: option.getAttribute('data-variable-value')
          };

          // Mettre à jour l'affichage
          updateCustomDropdownTrigger(container, selectedSuggestion);

          // Fermer le dropdown
          container.classList.remove('open');

          // Stocker la sélection
          container._selectedVariableId = variableId;

          // Activer le bouton de validation
          var card = container.closest('.cleaning-result-card') || container.closest('.scan-result-card');
          if (card) {
            var applyBtn = card.querySelector('.manual-apply-btn') || card.querySelector('button[data-action="apply"]');
            if (applyBtn) {
              applyBtn.disabled = false;
              card.classList.add('ready-to-apply');
            }

            // Trigger Live Preview

            if (variableId && livePreviewReady) {
              sendPreviewFix(indices, variableId);
            } else {
            }
          } else {
          }

          e.stopPropagation();
          return;
        }

        // Fermer tous les dropdowns ouverts quand on clique ailleurs
        if (!e.target.closest('.custom-select-container')) {
          document.querySelectorAll('.custom-select-container.open').forEach(function (cont) {
            cont.classList.remove('open');
          });
        }
      });
    }

    function toggleCustomDropdown(container) {
      var isOpen = container.classList.contains('open');

      // Fermer tous les autres dropdowns
      document.querySelectorAll('.custom-select-container.open').forEach(function (other) {
        if (other !== container) {
          other.classList.remove('open');
        }
      });

      // Basculer l'état de ce dropdown
      if (isOpen) {
        container.classList.remove('open');
      } else {
        container.classList.add('open');
      }
    }

    // Garder l'alias pour compatibilité si nécessaire, mais on l'appelle dans DOMContentLoaded
    var initManualSelectors = initVariableSelectors;

    function updateManualApplyButton() {
      var readyCards = document.querySelectorAll('.manual-fix.ready-to-apply');
      var applyBtn = document.getElementById('applyAllManualBtn');

      if (readyCards.length > 0) {
        applyBtn.disabled = false;
        applyBtn.textContent = '✅ Appliquer les ' + readyCards.length + ' sélection' + (readyCards.length > 1 ? 's' : '');
      } else {
        applyBtn.disabled = true;
        applyBtn.textContent = '⚠️ Appliquer les sélections manuelles';
      }
    }

    // Application groupée des corrections manuelles
    function applyAllManualFixes() {
      // Vérifier que nous sommes sur l'onglet "Manuel"
      var manualTab = document.querySelector('.tab[data-filter="manual"]');
      var isManualTabActive = manualTab && manualTab.classList.contains('active');

      if (!isManualTabActive) {
        showNotification('Cette action n\'est disponible que sur l\'onglet "Manuel"', 'warning');
        return;
      }

      var readyCards = document.querySelectorAll('.manual-fix.ready-to-apply');
      var fixesApplied = 0;

      readyCards.forEach(function (card) {
        var select = card.querySelector('.manual-select');
        if (select && select.value) {
          var indicesRaw = select.getAttribute('data-indices');
          var indices = indicesRaw ? indicesRaw.split(',').map(Number) : [];
          var variableId = select.value;

          // Simuler l'application (vous devrez adapter selon votre logique existante)
          applyGroupFix(indices, variableId);
          fixesApplied++;
        }
      });

      if (fixesApplied > 0) {
        // Feedback utilisateur
        showNotification(fixesApplied + ' correction' + (fixesApplied > 1 ? 's' : '') + ' manuelle' + (fixesApplied > 1 ? 's' : '') + ' appliquée' + (fixesApplied > 1 ? 's' : '') + ' !', 'success');
      }
    }

    // ============================================
    // TOAST NOTIFICATIONS PREMIUM
    // ============================================
    function showToast(message, type) {
      type = type || 'success';

      var toast = document.createElement('div');
      toast.className = 'toast toast-' + type;

      var icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
      toast.innerHTML = '<span class="toast-icon">' + icon + '</span><span>' + message + '</span>';

      document.body.appendChild(toast);

      setTimeout(function () {
        toast.classList.add('toast-show');
      }, 10);

      setTimeout(function () {
        toast.classList.remove('toast-show');
        setTimeout(function () {
          toast.remove();
        }, 300);
      }, 3000);
    }


    // Alias pour compatibilité
    function showNotification(message, type) {
      showToast(message, type);
    }

    // ============================================
    // MODERN NOTIFICATION WITH UNDO BUTTON
    // ============================================
    var currentModernNotification = null;

    function showModernNotification(options) {
      // Fermer la notification existante
      if (currentModernNotification) {
        closeModernNotification();
      }

      var notif = document.createElement('div');
      notif.className = 'notification-modern ' + (options.type || 'success');

      var closeBtn = '<button class="notification-modern-close" onclick="closeModernNotification()">×</button>';

      var icon = options.icon || '✓';
      var title = options.title || 'Succès';
      var message = options.message || '';

      var actionsHtml = '';
      if (options.actions && options.actions.length > 0) {
        actionsHtml = '<div class="notification-modern-actions">';
        options.actions.forEach(function (action) {
          var btnClass = action.primary ? 'notification-modern-btn-primary' : 'notification-modern-btn-secondary';
          actionsHtml += '<button class="notification-modern-btn ' + btnClass + '" onclick="' + action.onclick + '">' + action.label + '</button>';
        });
        actionsHtml += '</div>';
      }

      notif.innerHTML = closeBtn +
        '<div class="notification-modern-header">' +
        '<div class="notification-modern-icon">' + icon + '</div>' +
        '<div class="notification-modern-content">' +
        '<div class="notification-modern-title">' + title + '</div>' +
        '<div class="notification-modern-message">' + message + '</div>' +
        '</div>' +
        '</div>' +
        actionsHtml;

      document.body.appendChild(notif);
      currentModernNotification = notif;

      setTimeout(function () {
        notif.classList.add('show');
      }, 10);

      // Auto-fermer après un délai (sauf si actions présentes)
      if (!options.actions || options.actions.length === 0) {
        setTimeout(function () {
          closeModernNotification();
        }, options.duration || 4000);
      }
    }

    function closeModernNotification() {
      if (currentModernNotification) {
        currentModernNotification.classList.remove('show');
        setTimeout(function () {
          if (currentModernNotification) {
            currentModernNotification.remove();
            currentModernNotification = null;
          }
        }, 400);
      }
    }

    // Fonction d'annulation du batch de corrections
    function undoLastBatch() {
      if (!lastBatchHistory || lastBatchHistory.length === 0) {
        showNotification('Aucune correction à annuler', 'warning');
        return;
      }

      closeModernNotification();

      // Afficher un loading
      showNotification('Annulation en cours...', 'info');

      // Envoyer la demande d'annulation au backend
      parent.postMessage({
        pluginMessage: {
          type: 'undo-batch',
          batchHistory: lastBatchHistory
        }
      }, '*');
    }



    // ✨ KEYBOARD NAVIGATION : Navigation au clavier premium
    var keyboardSelectedIndex = -1;
    var keyboardSelectableCards = [];

    function updateKeyboardSelectableCards() {
      keyboardSelectableCards = Array.from(document.querySelectorAll('.cleaning-result-card')).filter(function (card) {
        // Ne prendre que les cartes qui ont des boutons d'action disponibles
        return card.querySelector('button.variable-pill') || card.querySelector('.variable-selector');
      });
    }

    function clearKeyboardSelection() {
      keyboardSelectableCards.forEach(function (card) {
        card.classList.remove('keyboard-selected');
      });
      keyboardSelectedIndex = -1;
    }

    function setKeyboardSelection(index) {
      clearKeyboardSelection();
      if (index >= 0 && index < keyboardSelectableCards.length) {
        keyboardSelectableCards[index].classList.add('keyboard-selected');
        keyboardSelectedIndex = index;
        // Scroll into view
        keyboardSelectableCards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function applyKeyboardSelection() {
      if (keyboardSelectedIndex >= 0 && keyboardSelectedIndex < keyboardSelectableCards.length) {
        var card = keyboardSelectableCards[keyboardSelectedIndex];
        var variablePill = card.querySelector('button.variable-pill');
        var variableSelector = card.querySelector('.variable-selector');

        if (variablePill && !variablePill.disabled) {
          // Appliquer la correction automatique
          variablePill.click();
        } else if (variableSelector && !variableSelector.disabled) {
          // Focus sur le sélecteur manuel
          variableSelector.focus();
        }
      }
    }

    function handleKeyboardNavigation(event) {
      // Ne pas interférer avec les inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      // Mettre à jour la liste des cartes sélectionnables
      updateKeyboardSelectableCards();

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          var nextIndex = keyboardSelectedIndex + 1;
          if (nextIndex >= keyboardSelectableCards.length) nextIndex = 0;
          setKeyboardSelection(nextIndex);
          break;

        case 'ArrowUp':
          event.preventDefault();
          var prevIndex = keyboardSelectedIndex - 1;
          if (prevIndex < 0) prevIndex = keyboardSelectableCards.length - 1;
          setKeyboardSelection(prevIndex);
          break;

        case 'Enter':
          event.preventDefault();
          applyKeyboardSelection();
          break;

        case 'Escape':
          event.preventDefault();
          clearKeyboardSelection();
          break;
      }
    }

    // Attacher les event listeners au document
    document.addEventListener('keydown', handleKeyboardNavigation);

    // Mettre à jour les cartes sélectionnables quand le contenu change
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          updateKeyboardSelectableCards();
        }
      });
    });

    // Observer les changements dans la liste des résultats
    var scanResultsList = document.getElementById('scanResults');
    if (scanResultsList) {
      observer.observe(scanResultsList, { childList: true, subtree: true });
    }

    // Appliquer toutes les corrections automatiques avec animations séquentielles
    function applyAllAutoFixes() {
      // Vérifier que nous sommes sur l'onglet "Auto"
      var autoTab = document.querySelector('.tab[data-filter="auto"]');
      var isAutoTabActive = autoTab && autoTab.classList.contains('active');

      if (!isAutoTabActive) {
        showNotification('Cette action n\'est disponible que sur l\'onglet "Auto"', 'warning');
        return;
      }

      // Récupérer TOUTES les cartes avec un bouton "Appliquer" visible dans l'onglet actif
      var allVisibleCards = Array.from(document.querySelectorAll('.cleaning-result-card:not(.is-ignored-permanently)'))
        .filter(card => card.style.display !== 'none');

      // Filtrer pour ne garder que celles qui ont un bouton data-action="apply"
      var autoCards = allVisibleCards.filter(card => {
        var applyBtn = card.querySelector('button[data-action="apply"]');
        return applyBtn !== null;
      });

      if (autoCards.length === 0) return;

      // Désactiver le bouton
      var applyBtn = document.getElementById('applyAllAutoBtn');
      if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.textContent = 'Correction en cours...';
      }

      var fixesApplied = 0;
      var processedCards = 0;
      var batchHistory = []; // Historique pour l'annulation

      // Plus de manipulation d'overflow - animation contenue

      // Fonction pour traiter chaque carte séquentiellement
      function processNextCard() {
        if (processedCards >= autoCards.length) {
          finishAnimation();
          return;
        }

        var card = autoCards[processedCards];

        var applyBtn = card.querySelector('button[data-action="apply"]');
        if (!applyBtn) {
          // Cette situation ne devrait pas arriver car on filtre les cartes avec boutons
          processedCards++;
          processNextCard();
          return;
        }

        // Récupérer les données depuis les attributs data de la carte
        var indicesJson = card.getAttribute('data-indices');
        var variableId = card._selectedVariableId || card.getAttribute('data-suggested-variable');

        console.log('Card data:', { indicesJson: indicesJson, variableId: variableId, selectedVariableId: card._selectedVariableId });

        if (indicesJson && variableId) {
          var indices = JSON.parse(indicesJson);
          console.log('Extracted indices:', indices, 'variableId:', variableId);

          // Sauvegarder dans l'historique pour pouvoir annuler
          indices.forEach(function (idx) {
            if (lastScanResults && lastScanResults[idx]) {
              batchHistory.push({
                nodeId: lastScanResults[idx].nodeId,
                indices: [idx],
                variableId: variableId,
                property: lastScanResults[idx].property,
                figmaProperty: lastScanResults[idx].figmaProperty,
                currentValue: lastScanResults[idx].rawValue || lastScanResults[idx].value
              });
            }
          });

          // Appliquer la correction
          console.log('Calling applyGroupedFix with:', indices, variableId);
          applyGroupedFix(indices, variableId);
          fixesApplied++;
          console.log('applyGroupedFix called, fixesApplied now:', fixesApplied);

          // Attendre que l'animation se termine avant de passer à la suivante
          setTimeout(function () {
            processedCards++;
            processNextCard();
          }, 400);
        } else {
          console.log('[DEBUG] Could not extract data for card', processedCards, '- indicesJson:', indicesJson, '- variableId:', variableId);
          processedCards++;
          processNextCard();
        }
      }

      // Démarrer le traitement séquentiel
      console.log('[DEBUG] Starting sequential processing');
      processNextCard();

      function finishAnimation() {
        // Réactiver le bouton avec son texte dynamique
        if (applyBtn) {
          applyBtn.disabled = false;
          updateApplyButtonText();
        }

        // Notification de succès avec bouton d'annulation
        if (fixesApplied > 0) {
          // Sauvegarder l'historique global pour l'annulation
          lastBatchHistory = batchHistory;

          // Afficher la notification moderne avec le bouton d'annulation
          showModernNotification({
            type: 'success',
            icon: '✓',
            title: 'Corrections appliquées !',
            message: fixesApplied + ' correction' + (fixesApplied > 1 ? 's' : '') + ' appliquée' + (fixesApplied > 1 ? 's' : '') + ' avec succès.',
            actions: [
              {
                label: 'Annuler',
                primary: false,
                onclick: 'undoLastBatch()'
              }
            ]
          });
          // ❌ SUPPRIMÉ : applyFilter() - Cause des animations parasites
        }
      }
    }

    // Exporter un rapport de nettoyage
    function exportCleaningReport() {
      var stats = {
        // totalIssues supprimé
        autoFixable: parseInt(document.getElementById('autoFixable').textContent) || 0,
        manualFixes: parseInt(document.getElementById('manualFixes').textContent) || 0,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      var report = {
        title: 'Rapport de nettoyage Emma Plugin',
        date: new Date().toLocaleDateString('fr-FR'),
        stats: stats,
        summary: {
          total_problems: stats.totalIssues,
          auto_correctable: stats.autoFixable,
          manual_required: stats.manualFixes,
          completion_rate: 0 // Supprimé car totalIssues n'est plus affiché
        }
      };

      // Créer un blob avec le rapport JSON
      var reportJson = JSON.stringify(report, null, 2);
      var blob = new Blob([reportJson], { type: 'application/json' });

      // Simuler un téléchargement (dans un vrai plugin, ceci serait géré côté plugin principal)
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'emma-cleaning-report-' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('Rapport exporté avec succès !', 'success');
    }

    // Initialisation au chargement
    document.addEventListener('DOMContentLoaded', function () {
      initFilterSystem();
      initManualSelectors();
      initCustomDropdowns();
    });

    // Fonction helper pour générer le sélecteur de variable
    function generateVariableSelector(result, index) {
      var suggestions = result.colorSuggestions || result.numericSuggestions || [];
      var hasSingleExactMatch = suggestions.length === 1 && suggestions[0].isExact;

      // Si pas de suggestions mais qu'il y a une variable suggérée, créer une suggestion exacte
      if (suggestions.length === 0 && result.suggestedVariableId) {
        suggestions = [{ id: result.suggestedVariableId, name: result.suggestedVariableName, isExact: true }];
        hasSingleExactMatch = true;
      }

      // Vérifier si des suggestions ont un scope mismatch
      var hasScopeMismatch = suggestions.some(function (s) { return s.scopeMismatch; });

      if (hasSingleExactMatch) {
        // Correspondance exacte : badge statique
        var badgeStyle = hasScopeMismatch ?
          'background: var(--poly-warning); border: 1px solid var(--poly-warning);' :
          'background: var(--poly-accent);';
        var badgeHtml = '<div class="variable-badge exact-match" style="' + badgeStyle + ' color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; font-family: monospace;">' + result.suggestedVariableName;
        if (hasScopeMismatch) {
          badgeHtml += ' ⚠️';
        }
        badgeHtml += '</div>';
        return badgeHtml;
      } else if (suggestions.length > 0) {
        // Suggestions multiples : dropdown stylisé
        var dropdownStyle = hasScopeMismatch ?
          'background: var(--poly-warning); border: 1px solid var(--poly-warning);' :
          'background: var(--poly-accent);';
        var selectHtml = '<div style="position: relative;">';
        selectHtml += '<select class="variable-selector" data-index="' + index + '" style="appearance: none; ' + dropdownStyle + ' color: white; border: none; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; font-family: monospace; cursor: pointer; min-width: 80px;">';

        suggestions.forEach(function (suggestion, idx) {
          var selected = idx === 0 ? 'selected' : '';
          var distanceIndicator = suggestion.isExact ? '' : ' ≈';
          var scopeIndicator = suggestion.scopeMismatch ? ' ⚠️' : '';
          var valuePreview = suggestion.hex ? suggestion.hex : (suggestion.value !== undefined ? suggestion.value : "");
          selectHtml += '<option value="' + suggestion.id + '" ' + selected + '>' + suggestion.name + ' (' + valuePreview + ')' + distanceIndicator + scopeIndicator + '</option>';
        });

        selectHtml += '</select>';
        // Flèche du dropdown
        selectHtml += '<span style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); pointer-events: none; color: white; font-size: 8px;">▼</span>';
        selectHtml += '</div>';
        return selectHtml;
      }
    }

    function generateColorCard(result) {
      var icon = (result.property === "Fill" || result.property === "Local Fill Style") ? ICONS.fill : ICONS.stroke;
      var cardHtml = '<div class="scan-result-card" data-index="' + result.originalIndex + '" style="display: flex; align-items: center; padding: 12px 16px; margin-bottom: 8px; background: var(--poly-surface-soft); border: 1px solid var(--poly-border-subtle); border-radius: 8px; transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);">';

      // Nom de la propriété
      cardHtml += '<div style="display: flex; align-items: center; min-width: 80px; margin-right: 16px;">';
      cardHtml += '<span style="font-size: 12px; color: var(--poly-text-muted); font-weight: 500;">' + result.property + '</span>';
      cardHtml += '</div>';

      // Nom du layer
      cardHtml += '<div style="flex: 1; margin-right: 16px;">';
      cardHtml += '<div style="font-weight: 500; font-size: 13px; color: var(--poly-text-primary); margin-bottom: 2px;">' + result.layerName + '</div>';
      cardHtml += '</div>';

      // Transformation visuelle couleur
      cardHtml += '<div style="display: flex; align-items: center; margin-right: 16px;">';
      // Rond avec la couleur brute
      cardHtml += '<div style="width: 20px; height: 20px; border-radius: 50%; background-color: ' + result.value + '; border: 1px solid var(--poly-border-subtle); margin-right: 8px;"></div>';
      // Sélecteur de variable (badge ou dropdown)
      cardHtml += generateVariableSelector(result);
      cardHtml += '</div>';

      // Boutons d'action
      cardHtml += '<div style="display: flex; gap: 4px;">';
      cardHtml += '<button class="btn-primary" data-action="apply" data-index="' + result.originalIndex + '" title="Appliquer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg></button>';
      cardHtml += '<button class="btn-x" data-action="ignore" data-index="' + result.originalIndex + '" title="Ignorer"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
      cardHtml += '</div>';

      cardHtml += '</div>';
      return cardHtml;
    }

    function generateGeometryCard(result) {
      var icon = result.property.includes("Radius") ? ICONS.radius : ICONS.spacing;
      var cardHtml = '<div class="scan-result-card" data-index="' + result.originalIndex + '" style="display: flex; align-items: center; padding: 12px 16px; margin-bottom: 8px; background: var(--poly-surface-soft); border: 1px solid var(--poly-border-subtle); border-radius: 8px; transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);">';

      // Icône et nom de la propriété
      cardHtml += '<div style="display: flex; align-items: center; min-width: 80px; margin-right: 16px;">';
      cardHtml += '<span style="color: var(--poly-accent); margin-right: 6px;">' + icon + '</span>';
      cardHtml += '<span style="font-size: 12px; color: var(--poly-text-muted); font-weight: 500;">' + result.property + '</span>';
      cardHtml += '</div>';

      // Nom du layer
      cardHtml += '<div style="flex: 1; margin-right: 16px;">';
      cardHtml += '<div style="font-weight: 500; font-size: 13px; color: var(--poly-text-primary); margin-bottom: 2px;">' + result.layerName + '</div>';
      cardHtml += '</div>';

      // Transformation visuelle mesure
      cardHtml += '<div style="display: flex; align-items: center; margin-right: 16px;">';
      // Valeur en px
      cardHtml += '<span style="font-family: monospace; font-size: 13px; color: var(--poly-text-primary); margin-right: 8px;">' + result.value + '</span>';
      // Flèche
      cardHtml += '<span style="color: var(--poly-text-muted); margin-right: 8px;">→</span>';
      // Sélecteur de variable (badge ou dropdown)
      cardHtml += generateVariableSelector(result);
      cardHtml += '</div>';

      // Boutons d'action
      cardHtml += '<div style="display: flex; gap: 4px;">';
      cardHtml += '<button class="btn-primary" data-action="apply" data-index="' + result.originalIndex + '" title="Appliquer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg></button>';
      cardHtml += '<button class="btn-x" data-action="ignore" data-index="' + result.originalIndex + '" title="Ignorer"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
      cardHtml += '</div>';

      cardHtml += '</div>';
      return cardHtml;
    }

    function attachActionHandlers() {
      // Utiliser la délégation d'événements sur le container des résultats
      var unifiedList = document.getElementById('unifiedCleaningList');
      if (!unifiedList) {
        console.error('unifiedCleaningList not found');
        return;
      }

      // Supprimer les anciens écouteurs pour éviter les doublons
      var newUnifiedList = unifiedList.cloneNode(true);
      unifiedList.parentNode.replaceChild(newUnifiedList, unifiedList);

      // Attacher le nouvel écouteur sur le container
      newUnifiedList.addEventListener('click', function (e) {
        var button = e.target.closest('button[data-action]');
        if (!button) return;

        e.preventDefault();
        e.stopPropagation();

        var action = button.getAttribute('data-action');

        if (action === 'view') {
          // Action "Voir dans Figma" - sélectionner les nœuds
          var card = button.closest('.cleaning-result-card');
          if (card) {
            var indicesStr = card.getAttribute('data-indices');
            if (indicesStr) {
              try {
                var indices = JSON.parse(indicesStr);
                selectNodesInFigma(indices);
              } catch (err) {
                console.error("Erreur parsing indices pour view:", err);
              }
            }
          }
        } else if (action === 'apply') {
          // Vérifier si le bouton est désactivé
          if (button.disabled) return;

          // Action "Appliquer" - appliquer la correction
          var card = button.closest('.cleaning-result-card');
          if (card) {
            var indicesStr = card.getAttribute('data-indices');
            if (indicesStr) {
              try {
                var indices = JSON.parse(indicesStr);

                // Récupérer la variable sélectionnée
                var selectedVariableId = card._selectedVariableId;

                if (!selectedVariableId) {
                  // Logique de fallback : récupérer depuis les attributs data de la carte
                  selectedVariableId = card.getAttribute('data-suggested-variable');
                }

                if (!selectedVariableId) {
                  alert('Erreur: Aucune variable sélectionnée. Veuillez choisir une variable avant d\'appliquer.');
                  return;
                }

                // Pour les corrections groupées, envoyer chaque index individuellement
                console.log('Sending individual fixes for indices:', indices);
                indices.forEach(function (index) {
                  console.log('Sending fix for index:', index);
                  parent.postMessage({
                    pluginMessage: {
                      type: "apply-single-fix",
                      index: index,
                      selectedVariableId: selectedVariableId
                    }
                  }, "*");
                });

                // Animation de succès et masquage de la carte
                card.style.transition = 'all 0.3s ease';
                card.style.backgroundColor = 'var(--poly-success-light)';
                card.style.borderColor = 'var(--poly-success)';

                // Masquer la carte après un délai
                setTimeout(function () {
                  card.style.opacity = '0';
                  setTimeout(function () {
                    card.style.display = 'none';
                    if (typeof updateProblemCounter === 'function') {
                      updateProblemCounter(-indices.length); // Décrémenter du nombre d'éléments traités
                    }
                  }, 300);
                }, 500);
              } catch (err) {
                console.error("Erreur parsing indices pour apply:", err);
              }
            }
          }
        } else if (action === 'ignore') {
          // Action "Ignorer" - masquer la carte avec animation
          var card = button.closest('.cleaning-result-card');
          if (card) {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            setTimeout(function () {
              card.style.display = 'none';
              if (typeof updateProblemCounter === 'function') {
                updateProblemCounter(-1);
              }
            }, 300);
          }
        }
      });
    }

    function updateProblemCounter(change, reset) {
      // Sécurité : si la liste n'existe pas, on arrête tout pour éviter le crash
      if (!scanResultsList) return;

      var counterElement = document.getElementById('problemCounter');
      if (!counterElement) {
        // Créer le compteur s'il n'existe pas
        // On utilise la classe parente directe ou le parentElement
        var scanResultsContainer = document.querySelector('.cleaning-content') || scanResultsList.parentElement;
        if (scanResultsContainer) {
          var counterHtml = '<div id="problemCounter" style="text-align: center; margin-bottom: 16px; font-size: 14px; color: var(--poly-text-muted);">';
          counterHtml += '<span id="problemCount" style="font-weight: 600; color: var(--poly-accent); font-size: 18px;">0</span>';
          counterHtml += '</div>';
          // Insertion sécurisée
          var fragment = document.createRange().createContextualFragment(counterHtml);
          scanResultsContainer.insertBefore(fragment, scanResultsList);
          counterElement = document.getElementById('problemCounter');
        }
      }

      if (counterElement) {
        var countElement = document.getElementById('problemCount');
        if (countElement) {
          var currentCount;
          if (reset) {
            currentCount = 0;
          } else {
            currentCount = parseInt(countElement.textContent) || 0;
          }
          var newCount = Math.max(0, currentCount + change);
          countElement.textContent = newCount;

          // Masquer le compteur si aucun problème
          counterElement.style.display = newCount > 0 ? 'block' : 'none';
        }
      }

      // Mettre à jour les compteurs dans la status bar
      updateStatusBarCounters();
    }

    function updateStatusBarCounters() {
      // Recalculer les stats basées sur les cartes restantes
      var remainingCards = document.querySelectorAll('.cleaning-result-card');
      var total = 0;
      var autoFixable = 0;
      var manual = 0;

      remainingCards.forEach(function (card) {
        total++;
        if (card.classList.contains('auto-fixable')) {
          autoFixable++;
        } else if (card.classList.contains('manual-required')) {
          manual++;
        }
      });

      // Mettre à jour la status bar
      var totalIssues = document.getElementById('totalIssues');
      var autoFixableEl = document.getElementById('autoFixable');
      var manualFixes = document.getElementById('manualFixes');

      // if (totalIssues) totalIssues.textContent = total; // Supprimé
      if (autoFixableEl) autoFixableEl.textContent = autoFixable;
      if (manualFixes) manualFixes.textContent = manual;


    }


    // Scan buttons
    scanBtn.addEventListener("click", function () {
      if (isScanning) return; // Prevent re-scan if already scanning

      // Vider la liste des éléments ignorés lors d'une nouvelle analyse
      ignoredCardSignatures = [];
      ignoredResultIndices = [];
      appliedResultIndices = []; // Reset aussi les indices appliqués

      showScanLoading();
      parent.postMessage({
        pluginMessage: {
          type: "scan-frame"
        }
      }, "*");
    });


    // ============================================
    // GESTIONNAIRES D'ÉVÉNEMENTS PROPRES
    // ============================================

    // Bouton appliquer toutes les corrections automatiques (onglet Auto seulement)
    var applyAllAutoBtn = document.getElementById("applyAllAutoBtn");
    if (applyAllAutoBtn) {
      applyAllAutoBtn.addEventListener("click", function () {
        applyAllAutoFixes();
      });
    }

    // Bouton appliquer les sélections manuelles (onglet Manuel seulement)
    var applyAllManualBtn = document.getElementById("applyAllManualBtn");
    if (applyAllManualBtn) {
      applyAllManualBtn.addEventListener("click", function () {
        applyAllManualFixes();
      });
    }

    // Bouton back
    if (step4Back) {
      step4Back.addEventListener("click", function () {
        switchStep(0);
      });
    }

    // Bouton exporter le rapport
    var exportReportBtn = document.getElementById("exportReportBtn");
    if (exportReportBtn) {
      exportReportBtn.addEventListener("click", function () {
        exportCleaningReport();
      });
    }

    // ============================================
    // SECURE PREVIEW FUNCTION (ANTI-SELECTION-LOOP)
    // ============================================
    function sendPreviewFix(indices, variableId) {
      console.log('[UI PREVIEW] sendPreviewFix called', {
        indices: indices,
        variableId: variableId,
        livePreviewReady: livePreviewReady
      });

      // 🛡️ ACTIVER LE VERROU : Empêcher l'Auto-Scan de déclencher pendant le preview
      // Utilise le même mécanisme que les autres verrouillages (ignoreSelectionChangeUntil)
      window.ignoreSelectionChangeUntil = Date.now() + 2000; // 2 secondes de protection

      // Vérifier que le système est prêt
      if (!livePreviewReady) {
        console.warn('[UI PREVIEW] Live preview not ready!');
        return;
      }

      // 📤 ENVOYER LE MESSAGE DE PREVIEW
      var message = {
        pluginMessage: {
          type: 'preview-fix',
          indices: indices,
          variableId: variableId
        }
      };

      console.log('[UI PREVIEW] Sending message to plugin:', message);
      parent.postMessage(message, '*');
    }

    // ============================================
    // CONFIGURATION & UTILITIES
    // ============================================
    var DEBUG_UI = false; // Set to true for detailed UI logging

    function debugUI(label, data) {
      if (!DEBUG_UI) return;
      console.log('🎨 [UI] ' + label + ':', data);
    }

    function validateMessage(msg) {
      if (!msg || typeof msg !== 'object') {
        console.warn('⚠️ Invalid message received:', msg);
        return false;
      }
      if (!msg.type || typeof msg.type !== 'string') {
        console.warn('⚠️ Message missing type:', msg);
        return false;
      }
      return true;
    }

    // ============================================
    // MESSAGES FROM PLUGIN (ROBUST HANDLER)
    // ============================================
    // ============================================
    // MESSAGE HANDLERS (DEFINED ABOVE)
    // ============================================

    function handleMsg_logOnly(msg) { }

    function handleMsg_scanResults(msg) {
      var elapsed = Date.now() - (window.scanStartTime || 0);
      var minDelay = 800;
      var remainingDelay = Math.max(0, minDelay - elapsed);

      setTimeout(function () {
        try {
          if (typeof hideScanLoading === 'function') hideScanLoading();
          if (currentStep !== 4 && typeof switchStep === 'function') switchStep(4);
          if (typeof displayScanResults === 'function') displayScanResults(msg.results);
          parent.postMessage({ pluginMessage: { type: 'check-selection' } }, '*');
        } catch (innerError) {
          console.error("🔥 ERREUR CRITIQUE dans setTimeout scan-results:", innerError);
          var scanRes = document.getElementById("scanResults");
          if (scanRes) {
            scanRes.classList.remove('hidden');
            scanRes.style.display = 'flex';
          }
        }
      }, remainingDelay);
    }

    function handleMsg_init(msg) {
      if (msg.naming) {
        var libraryOption = document.querySelector('.library-option[data-library="' + msg.naming + '"]');
        if (libraryOption) {
          document.querySelectorAll('.library-option.selected').forEach(function (el) { el.classList.remove('selected'); });
          libraryOption.classList.add('selected');
          currentNaming = msg.naming;
          if (step1Next) step1Next.disabled = false;
          console.log('📂 Pre-selected saved library:', msg.naming);
        } else {
          currentNaming = "custom";
          if (step1Next) step1Next.disabled = true;
        }

        if (msg.savedSemanticTokens) {
          console.log('📂 Restored saved semantic tokens:', Object.keys(msg.savedSemanticTokens).length, 'tokens');
          if (!currentTokens) currentTokens = {};
          currentTokens.semantic = msg.savedSemanticTokens;
        }

        if (msg.savedScanResults && Array.isArray(msg.savedScanResults) && msg.savedScanResults.length > 0) {
          lastScanResults = msg.savedScanResults;
          console.log('📂 Restored saved scan results:', lastScanResults.length, 'items');
          parent.postMessage({ pluginMessage: { type: 'sync-scan-results', results: lastScanResults } }, '*');
        }

        if (msg.themeMode) {
          currentThemeMode = msg.themeMode;
          previewTheme = (currentThemeMode === 'both') ? 'light' : currentThemeMode;
          if (themeModeSelector) {
            // Mettre à jour les radio buttons
            themeModeSelector.querySelectorAll('.radio-option').forEach(function (opt) {
              opt.classList.remove('active');
            });
            themeModeSelector.querySelectorAll('input[type="radio"]').forEach(function (radio) {
              if (radio.value === currentThemeMode) {
                radio.checked = true;
                radio.parentElement.classList.add('active');
              }
            });
          }
        }

        if (msg.semanticNameMap) {
          window.SEMANTIC_NAME_MAP = msg.semanticNameMap;
          console.log('✅ Sync SEMANTIC_NAME_MAP to UI');
        }
      } else {
        currentNaming = "custom";
        if (step1Next) step1Next.disabled = true;
      }
    }
    function handleMsg_hasVariables(msg) {
      if (msg.value === true) {
        if (!designerView.classList.contains("hidden")) overwriteCheckboxContainer.classList.remove("hidden");
      } else {
        overwriteCheckboxContainer.classList.add("hidden");
      }
    }

    function handleMsg_existingTokens(msg) {
      console.log('📥 [HANDLE_EXISTING_TOKENS] Received message:', {
        hasTokens: !!(msg.tokens && Object.keys(msg.tokens).length > 0),
        tokenCategories: msg.tokens ? Object.keys(msg.tokens) : [],
        brandCount: msg.tokens && msg.tokens.brand ? Object.keys(msg.tokens.brand).length : 0,
        library: msg.library
      });

      if (msg.tokens && Object.keys(msg.tokens).length > 0) {
        hasExistingTokens = true;
        existingTokensData = msg.tokens;
        existingLibrary = msg.library || "tailwind";

        console.log('✅ [HANDLE_EXISTING_TOKENS] Data stored:', {
          hasExistingTokens: hasExistingTokens,
          existingTokensDataKeys: Object.keys(existingTokensData),
          existingTokensDataBrandCount: existingTokensData.brand ? Object.keys(existingTokensData.brand).length : 0
        });

        if (existingTokensData.brand) {
          var detectedColor = detectPrimaryColorFromTokens(existingTokensData.brand);
          if (detectedColor) {
            currentColor = detectedColor;
            if (colorInput) colorInput.value = currentColor;
            if (colorPicker) colorPicker.value = currentColor;
            updateColorPreview(currentColor);
          }
        }
        choiceManageTokens.classList.remove("hidden");
        var sectionAnalyze = document.querySelector('.section-analyze');
        if (sectionAnalyze) sectionAnalyze.style.display = '';

        var sectionCreate = document.querySelector('.section-create');
        if (sectionCreate) sectionCreate.style.display = 'none';

        var libraryNames = { "tailwind": "Tailwind / Shadcn", "mui": "Material UI", "ant": "Ant Design", "bootstrap": "Bootstrap", "chakra": "Chakra UI", "custom": "Custom" };
        existingTokensInfo.textContent = libraryNames[existingLibrary] || existingLibrary;

        var totalTokens = 0;
        for (var cat in msg.tokens) { if (msg.tokens.hasOwnProperty(cat)) totalTokens += Object.keys(msg.tokens[cat]).length; }
        existingTokensCount.textContent = totalTokens + " tokens disponibles";
      } else {
        console.log('⚠️ [HANDLE_EXISTING_TOKENS] No tokens in message');
        hasExistingTokens = false;
        var sectionCreate = document.querySelector('.section-create');
        if (sectionCreate) sectionCreate.style.display = '';
      }
    }

    function handleMsg_scanProgress(msg) {
      if (typeof updateScanProgress === 'function') updateScanProgress(msg.progress, msg.current, msg.total, msg.status);
    }
    function handleMsg_singleFixApplied(msg) {
      if (typeof handleSingleFixApplied === 'function') handleSingleFixApplied(msg.appliedCount, msg.error, msg.index);
    }

    function handleMsg_groupFixApplied(msg) {
      if (typeof handleGroupFixApplied === 'function') handleGroupFixApplied(msg.appliedCount, msg.error, msg.indices || []);
    }

    function handleMsg_batchUndoComplete(msg) {
      if (typeof closeModernNotification === 'function') closeModernNotification();

      var undoneCount = msg.undoneCount || 0;
      showNotification(undoneCount + ' correction' + (undoneCount > 1 ? 's' : '') + ' annulée' + (undoneCount > 1 ? 's' : ''), 'success');

      var undoneIndices = msg.indices || [];

      if (undoneIndices.length > 0) {
        console.log('🔄 Nettoyage appliedResultIndices. Avant:', appliedResultIndices);
        appliedResultIndices = appliedResultIndices.filter(function (idx) { return undoneIndices.indexOf(idx) === -1; });
        console.log('🔄 Après nettoyage:', appliedResultIndices);
      } else if (lastBatchHistory) {
        console.log('⚠️ msg.indices non fourni, reconstruction depuis lastBatchHistory');
        var reconstructedIndices = [];
        lastBatchHistory.forEach(function (item) { if (item.index !== undefined) reconstructedIndices.push(item.index); });
        appliedResultIndices = appliedResultIndices.filter(function (idx) { return reconstructedIndices.indexOf(idx) === -1; });
        console.log('🔄 Indices reconstruits et nettoyés:', reconstructedIndices);
      }

      lastBatchHistory = null;
      console.log('✨ Réaffichage instantané des cards annulées');
      var allCards = document.querySelectorAll('.cleaning-result-card, .compact-row');
      var cardsToRestore = [];

      allCards.forEach(function (card) {
        var cardIndices = JSON.parse(card.getAttribute('data-indices') || '[]');
        var hasUndoneIndex = cardIndices.some(function (idx) { return undoneIndices.indexOf(idx) !== -1; });
        if (hasUndoneIndex && card.style.display === 'none') {
          cardsToRestore.push(card);
        }
      });

      console.log('📋 Cards à restaurer:', cardsToRestore.length);

      if (cardsToRestore.length > 0) {
        cardsToRestore.forEach(function (card, index) {
          card.style.opacity = '0';
          card.style.transform = 'translateY(-8px)';
          card.style.display = 'flex';
          setTimeout(function () {
            card.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            setTimeout(function () {
              card.style.transition = '';
              card.style.opacity = '';
              card.style.transform = '';
            }, 400);
          }, index * 30);
        });
        setTimeout(function () {
          if (typeof updateDynamicTabCounts === 'function') updateDynamicTabCounts();
          if (typeof applyFilter === 'function') applyFilter(currentFilter || 'auto');
          console.log('✅ Cards restaurées avec succès');
        }, cardsToRestore.length * 30 + 400);
      }
    }
    function handleMsg_selectionChecked(msg) {
      if (currentStep !== 4) return;
      if (window.ignoreSelectionChangeUntil && Date.now() < window.ignoreSelectionChangeUntil) return;

      var newSelectionId = msg.selectionId || "";
      if (window.autoScanTimeout) clearTimeout(window.autoScanTimeout);

      window.autoScanTimeout = setTimeout(function () {
        if (msg.hasSelection) {
          if (window.lastScannedSelectionId === newSelectionId && !document.getElementById('scanResults').classList.contains('hidden')) return;
          if (isScanning) return;

          window.lastScannedSelectionId = newSelectionId;
          if (scanEmptyState) scanEmptyState.classList.add('hidden');

          if (typeof showScanLoading === 'function') showScanLoading();
          window.scanStartTime = Date.now();
          parent.postMessage({ pluginMessage: { type: 'scan-frame' } }, '*');

          if (scanBtn) {
            scanBtn.disabled = false;
            scanBtn.textContent = "Relancer l'analyse";
            scanBtn.className = "btn-outline";
            scanBtn.onclick = function () {
              if (isScanning) return;
              ignoredCardSignatures = [];
              ignoredResultIndices = [];
              appliedResultIndices = [];
              if (typeof showScanLoading === 'function') showScanLoading();
              parent.postMessage({ pluginMessage: { type: 'scan-frame' } }, '*');
            };
          }
        } else {
          isScanning = false;
          window.lastScannedSelectionId = null;
          if (typeof hideScanLoading === 'function') hideScanLoading();

          if (document.getElementById('scanResults')) {
            document.getElementById('scanResults').classList.add("hidden");
            document.getElementById('scanResults').style.display = 'none';
          }

          if (scanEmptyState) {
            scanEmptyState.classList.remove("hidden");
            scanEmptyState.style.display = 'block';
            if (!scanEmptyState.innerHTML.includes('Sélectionnez une zone')) {
              scanEmptyState.innerHTML = '<div style="text-align: center; padding: 60px 20px;"><div class="empty-icon">🎯</div><h3>Sélectionnez une frame.</h3><p style="text-align: center; color: var(--poly-text-muted); font-size: 13px; margin: 16px auto; max-width: 320px; line-height: 1.6;">Les écarts avec votre système de tokens seront automatiquement détectés.</p></div>';
            }
          }

          if (scanBtn) {
            scanBtn.disabled = true;
            scanBtn.className = "btn-secondary";
          }
        }
      }, 300);
    }

    function handleMsg_allFixesApplied(msg) {
      if (typeof UIManager !== 'undefined' && UIManager.handleAllFixesApplied) {
        UIManager.handleAllFixesApplied({ appliedCount: msg.appliedCount, cards: document.querySelectorAll('.cleaning-result-card') });
      } else {
        var cards = document.querySelectorAll('.cleaning-result-card');
        var processed = 0;
        function processNextCard() {
          if (processed >= cards.length) {
            setTimeout(function () {
              var scanResultsList = document.getElementById("unifiedCleaningList");
              if (scanResultsList) scanResultsList.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--poly-success);"><p>✅ ' + msg.appliedCount + ' correction(s) appliquée(s) avec succès !</p></div>';
            }, 200);
            return;
          }
          var card = cards[processed];
          card.style.transition = 'all 0.15s ease';
          card.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
          card.style.borderColor = 'rgba(34, 197, 94, 0.3)';
          setTimeout(function () {
            card.style.display = 'none';
            card.style.backgroundColor = '';
            card.style.borderColor = '';
            card.style.transition = '';
            processed++;
            setTimeout(processNextCard, 200);
          }, 150);
        }
        if (cards.length > 0) processNextCard();
        else {
          var scanResultsList = document.getElementById("unifiedCleaningList");
          if (scanResultsList) scanResultsList.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--poly-success);"><p>✅ ' + msg.appliedCount + ' correction(s) appliquée(s) avec succès !</p></div>';
        }
        var applyAllAutoBtn = document.getElementById("applyAllAutoBtn");
        var step4ApplyAll = document.getElementById("step4ApplyAll");
        if (applyAllAutoBtn) { applyAllAutoBtn.disabled = false; updateApplyButtonText(); }
        if (step4ApplyAll) { step4ApplyAll.disabled = false; step4ApplyAll.textContent = '✨ Appliquer tout'; }
        var applyAllSection = document.getElementById("applyAllSection");
        if (applyAllSection) applyAllSection.style.display = 'none';
      }
    }

    function handleMsg_semanticTokensRehydrated(msg) {
      console.log("✨ Semantic tokens rehydrated:", msg.tokens);
      if (msg.tokens && Object.keys(msg.tokens).length > 0) {
        if (!currentTokens) currentTokens = {};
        currentTokens.semantic = msg.tokens;
        if (typeof updatePreview === 'function' && currentStep === 3) updatePreview();
        if (typeof updateExport === 'function') updateExport();
        console.log('✅ Semantic tokens updated in UI after rehydration');
      }
    }

    function handleMsg_tokensGenerated(msg) {
      console.log("🎉 Fresh tokens generated:", msg.tokens);
      currentTokens = msg.tokens;
      currentNaming = msg.naming || currentNaming;
      if (msg.semanticNameMap) window.SEMANTIC_NAME_MAP = msg.semanticNameMap;
      showNotification("Tokens générés avec succès !", "success");
      if (typeof switchStep === 'function') switchStep(3);
      if (typeof updatePreview === 'function') updatePreview();
    }
    var UI_HANDLERS = {
      "scan-results": handleMsg_scanResults,
      "init": handleMsg_init,
      "has-variables": handleMsg_hasVariables,
      "existing-tokens": handleMsg_existingTokens,
      "scan-progress": handleMsg_scanProgress,
      "single-fix-applied": handleMsg_singleFixApplied,
      "group-fix-applied": handleMsg_groupFixApplied,
      "batch-undo-complete": handleMsg_batchUndoComplete,
      "selection-checked": handleMsg_selectionChecked,
      "all-fixes-applied": handleMsg_allFixesApplied,
      "semantic-tokens-rehydrated": handleMsg_semanticTokensRehydrated,
      "tokens-generated": handleMsg_tokensGenerated,
      "preview-result": handleMsg_logOnly,
      "preview-error": handleMsg_logOnly,
      "sync-confirmation": handleMsg_logOnly
    };


    window.onmessage = function (event) {
      try {
        var msg = event.data.pluginMessage;
        if (!msg) return;

        // Validate message structure
        if (!validateMessage(msg)) return;

        debugUI('Plugin → UI: ' + msg.type, msg);

        var handler = (typeof UI_HANDLERS !== 'undefined') ? UI_HANDLERS[msg.type] : null;

        if (handler) {
          handler(msg);
        } else {
          // Log warning unless it's a known semantic message without handler
          if (["preview-result", "preview-error", "sync-confirmation"].indexOf(msg.type) === -1) {
            console.warn('⚠️ No handler for message type:', msg.type);
          }
        }

      } catch (globalError) {
        console.error("🔥 GLOBAL UI CRASH:", globalError);
        // Force unlock UI
        if (typeof hideScanLoading === 'function') hideScanLoading();
        // alert("Une erreur inattendue est survenue. L'interface a été débloquée.");
      }
    };



    // Fonction pour synchroniser manuellement les résultats de scan
    function syncScanResults() {

      if (lastScanResults && lastScanResults.length > 0) {
        parent.postMessage({
          pluginMessage: {
            type: 'sync-scan-results',
            results: lastScanResults
          }
        }, '*');
      } else {
        console.error('🔄 SYNC: Aucun résultat disponible pour synchronisation');
        if (typeof figma !== 'undefined' && figma.notify) {
          figma.notify('❌ Aucun résultat à synchroniser', { timeout: 2000 });
        }
      }
    }

    // ============================================
    // PREVIEW & EXPORT FUNCTIONS
    // ============================================

    // Mode Toggle (Designer / Developer)
    modeDesigner.addEventListener("click", function () {
      modeDesigner.classList.add("active");
      modeDev.classList.remove("active");

      designerView.classList.remove("hidden");
      devView.classList.add("hidden");

      // Footer Switch
      footerDesignerOps.classList.remove("hidden");
      footerDevOps.classList.add("hidden");

      // Toggle Overwrite checkbox visibility logic (restore if needed)
      if (hasExistingTokens) {
        overwriteCheckboxContainer.classList.remove("hidden");
      }
    });

    modeDev.addEventListener("click", function () {
      modeDev.classList.add("active");
      modeDesigner.classList.remove("active");

      devView.classList.remove("hidden");
      designerView.classList.add("hidden");

      // Footer Switch
      footerDevOps.classList.remove("hidden");
      footerDesignerOps.classList.add("hidden");

      // Hide Overwrite checkbox in Dev mode (irrelevant)
      overwriteCheckboxContainer.classList.add("hidden");

      // Générer l'export immédiatement
      updateExport();
    });

    // Token Category Tabs
    tokenTabs.addEventListener("click", function (e) {
      if (e.target.classList.contains("tab")) {
        var tabs = tokenTabs.querySelectorAll(".tab");
        tabs.forEach(function (tab) { tab.classList.remove("active"); });
        e.target.classList.add("active");
        activeCategory = e.target.getAttribute("data-category");
        updatePreview();
      }
    });

    var previewTheme = 'light';
    window.switchPreviewTheme = function (theme) {
      previewTheme = theme;
      updatePreview();
    };

    function updatePreview() {
      // 🔍 DIAGNOSTIC: Log what data we're using
      console.log('🎨 [UPDATE_PREVIEW] Called with:', {
        hasCurrentTokens: !!currentTokens,
        hasExistingTokensData: !!existingTokensData,
        activeCategory: activeCategory,
        currentTokensKeys: currentTokens ? Object.keys(currentTokens) : [],
        existingTokensDataKeys: existingTokensData ? Object.keys(existingTokensData) : []
      });

      // Use existingTokensData if we're managing existing tokens, otherwise use currentTokens (generated)
      var tokensSource = existingTokensData || currentTokens;

      if (!tokensSource) {
        console.log('⚠️ [UPDATE_PREVIEW] No tokens source available');
        return;
      }

      var categoryData = tokensSource[activeCategory];
      console.log('🔍 [UPDATE_PREVIEW] Category data:', {
        category: activeCategory,
        hasCategoryData: !!categoryData,
        categoryDataKeys: categoryData ? Object.keys(categoryData).slice(0, 5) : []
      });

      var previewData = categoryData;

      // Mélanger primitives + sémantiques selon la catégorie
      if (currentTokens.semantic) {
        if (activeCategory === "semantic") {
          // Onglet Semantic : afficher TOUS les sémantiques
          previewData = currentTokens.semantic;

          // GESTION DU MODE BOTH : Si on a des modes, utiliser celui sélectionné pour la preview
          if (previewData.modes) {
            previewData = previewData.modes[previewTheme] || previewData.modes.light;
          }
        } else {
          previewData = categoryData || {};
        }
      }

      if (!previewData) {
        tokenPreview.innerHTML = "<p style='color: var(--poly-text-muted); text-align: center; padding: 20px;'>No tokens available for this category.</p>";
        return;
      }

      var isColor = (activeCategory === "brand" || activeCategory === "system" || activeCategory === "gray");

      // Pour l'onglet semantic, vérifier s'il y a des tokens de couleur
      var hasColorTokens = isColor;
      if (activeCategory === "semantic" && previewData) {
        for (var k in previewData) {
          if (!previewData.hasOwnProperty(k)) continue;
          var tokenValue = previewData[k];
          // Vérifier si c'est un token de couleur (commence par bg., text., border., action., status. ou contient color, background)
          var kLower = k.toLowerCase();
          if (kLower.startsWith('bg') || kLower.startsWith('background') || kLower.startsWith('text') || kLower.startsWith('border') || kLower.startsWith('action') || kLower.startsWith('status') || kLower.indexOf('color') !== -1) {
            hasColorTokens = true;
            break;
          }
        }
      }

      // Logic to Determine Lock State
      var isCustomLib = (currentNaming === "custom");
      var isLocked = !isCustomLib && !isColor; // Lock if Standard Lib AND Non-Color structure

      var html = "";

      // Add Theme Toggle if in Both mode
      if (currentTokens.semantic && currentTokens.semantic.modes && activeCategory === "semantic") {
        html += "<div class='tabs' style='margin-bottom: 16px; background: var(--poly-surface); padding: 4px; border-radius: 8px; display: flex; gap: 4px;'>";
        html += "<button class='tab " + (previewTheme === 'light' ? 'active' : '') + "' onclick='switchPreviewTheme(\"light\")' style='flex:1; padding: 6px; font-size: 11px; border:none;'>Light Theme</button>";
        html += "<button class='tab " + (previewTheme === 'dark' ? 'active' : '') + "' onclick='switchPreviewTheme(\"dark\")' style='flex:1; padding: 6px; font-size: 11px; border:none;'>Dark Theme</button>";
        html += "</div>";
      }

      // Stylish Banner for Locked State (Placed at Top)
      if (isLocked) {
        var libName = (currentNaming ? currentNaming.charAt(0).toUpperCase() + currentNaming.slice(1) : "Standard");
        html += "<div class='locked-banner' style='margin-bottom: 12px; margin-top: 0;'>";
        html += "<span class='icon'>🔒</span>";
        html += "<div>";
        html += "<div class='locked-banner-text'>" + libName + " standards are active.</div>";
        html += "<span class='locked-banner-sub'>Structure tokens are locked to ensure code compatibility.</span>";
        html += "</div>";
        html += "</div>";
      }

      // Créer le tableau avec DOM API (plus propre, pas d'innerHTML)
      var table = document.createElement('table');
      table.className = 'token-table';

      // Header
      var thead = document.createElement('thead');
      var headerRow = document.createElement('tr');

      // Header avec colonne visuelle uniquement s'il y a des couleurs
      if (hasColorTokens) {
        var visualHeader = document.createElement('th');
        visualHeader.style.width = '50px';
        visualHeader.style.minWidth = '50px';
        visualHeader.textContent = 'Color';
        headerRow.appendChild(visualHeader);

        var nameHeader = document.createElement('th');
        nameHeader.style.width = '30%';
        nameHeader.textContent = 'Name';
        headerRow.appendChild(nameHeader);
      } else {
        var nameHeader = document.createElement('th');
        nameHeader.style.width = '35%';
        nameHeader.textContent = 'Name';
        headerRow.appendChild(nameHeader);
      }

      var valueHeader = document.createElement('th');
      valueHeader.style.width = 'auto'; // Prend le reste de l'espace
      valueHeader.textContent = 'Value';
      headerRow.appendChild(valueHeader);

      // Actions header seulement si custom
      if (isCustomLib) {
        var actionsHeader = document.createElement('th');
        actionsHeader.style.width = '60px';
        actionsHeader.textContent = 'Actions';
        headerRow.appendChild(actionsHeader);
      }

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Body avec les rows de tokens
      var tbody = document.createElement('tbody');

      // Affichage uniforme pour tous les types de tokens (primitives et sémantiques)
      for (var key in previewData) {
        if (!previewData.hasOwnProperty(key)) continue;

        var isSemanticToken = key.indexOf('.') !== -1;
        var row = renderTokenRow({
          key: key,
          value: previewData[key],
          isColorCategory: isColor,
          isSemanticToken: isSemanticToken,
          isLocked: isLocked,
          isCustomLib: isCustomLib,
          activeCategory: activeCategory,
          hasColorTableColumn: hasColorTokens
        });

        tbody.appendChild(row);
      }

      // Row d'ajout de nouveau token
      var addRow = document.createElement('tr');
      addRow.className = 'add-token-row';
      addRow.style.background = 'rgba(138, 213, 63, 0.05)';

      if (isColor && activeCategory !== "semantic") {
        var addColorCell = document.createElement('td');
        var addSwatch = document.createElement('div');
        addSwatch.className = 'color-swatch';
        addSwatch.style.border = '1px dashed var(--poly-border-subtle)';
        addSwatch.style.background = 'transparent';
        addColorCell.appendChild(addSwatch);
        addRow.appendChild(addColorCell);
      }

      var addKeyCell = document.createElement('td');
      var keyInput = document.createElement('input');
      keyInput.id = 'newTokenKey';
      keyInput.className = 'table-input';
      keyInput.type = 'text';
      keyInput.placeholder = 'Nom (ex: 500)';
      addKeyCell.appendChild(keyInput);
      addRow.appendChild(addKeyCell);

      var addValueCell = document.createElement('td');
      var valueInput = document.createElement('input');
      valueInput.id = 'newTokenValue';
      valueInput.className = 'table-input';
      valueInput.type = 'text';
      valueInput.placeholder = 'Valeur';
      addValueCell.appendChild(valueInput);
      addRow.appendChild(addValueCell);

      if (isCustomLib) {
        var addActionCell = document.createElement('td');
        addActionCell.style.textAlign = 'center';
        var addBtn = document.createElement('button');
        addBtn.className = 'btn-icon';
        addBtn.onclick = quickAddToken;
        addBtn.title = 'Ajouter';
        var addIcon = document.createElement('span');
        addIcon.className = 'icon';
        addIcon.style.color = 'var(--poly-accent)';
        addIcon.style.fontWeight = 'bold';
        addIcon.style.fontSize = '18px';
        addIcon.textContent = '+';
        addBtn.appendChild(addIcon);
        addActionCell.appendChild(addBtn);
        addRow.appendChild(addActionCell);
      }

      tbody.appendChild(addRow);
      table.appendChild(tbody);

      // Remplacer le contenu
      tokenPreview.innerHTML = '';
      tokenPreview.appendChild(table);

      // Attacher les event listeners pour l'édition inline
      attachTokenEventListeners();

      // Listeners pour l'ajout rapide
      setTimeout(function () {
        var nk = document.getElementById('newTokenKey');
        var nv = document.getElementById('newTokenValue');
        if (nk && nv) {
          var handler = function (e) { if (e.key === 'Enter') quickAddToken(); };
          nk.addEventListener('keypress', handler);
          nv.addEventListener('keypress', handler);
        }
      }, 0);

    }

    // Fonction pour attacher les event listeners aux inputs de tokens
    function attachTokenEventListeners() {
      // Add event listeners to all editable inputs for inline editing
      var inputs = tokenPreview.querySelectorAll('.token-value-input:not(.locked)');
      inputs.forEach(function (input) {
        input.addEventListener('change', function () {
          var tokenKey = input.getAttribute('data-token-key');
          var newValue = input.value.trim();
          if (newValue && currentTokens[activeCategory][tokenKey]) {
            currentTokens[activeCategory][tokenKey] = newValue;
            updateExport();
            // Refresh preview to update color swatch if it's a color
            if (isColor) {
              updatePreview();
            }
          }
        });
      });

      // Listeners pour l'ajout rapide
      setTimeout(function () {
        var nk = document.getElementById('newTokenKey');
        var nv = document.getElementById('newTokenValue');
        if (nk && nv) {
          var handler = function (e) { if (e.key === 'Enter') quickAddToken(); };
          nk.addEventListener('keypress', handler);
          nv.addEventListener('keypress', handler);
        }
      }, 0);

      // Add event listeners to all inputs for inline editing
      var inputs = tokenPreview.querySelectorAll('.table-input');
      inputs.forEach(function (input) {
        input.addEventListener('change', function () {
          var tokenKey = input.getAttribute('data-token-key');
          var newValue = input.value.trim();
          if (newValue && currentTokens[activeCategory][tokenKey]) {
            currentTokens[activeCategory][tokenKey] = newValue;
            updateExport();
            // Refresh preview to update color swatch if it's a color
            if (isColor) {
              updatePreview();
            }
          }
        });
      });
    }

    function highlightSyntax(code, lang) {
      if (!code) return "";

      // Basic HTML Escape
      code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      if (lang === 'json') {
        return code.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
          var cls = 'syn-number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'syn-key';
            } else {
              cls = 'syn-string';
            }
          } else if (/true|false|null/.test(match)) {
            cls = 'syn-kwd';
          }
          return '<span class="' + cls + '">' + match + '</span>';
        });
      }

      if (lang === 'css' || lang === 'scss') {
        return code
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="syn-comment">$1</span>') // Comments
          .replace(/([a-zA-Z-]+)(?=:)/g, '<span class="syn-key">$1</span>') // Props
          .replace(/(:)([^;]+)(;)/g, function (m, p1, p2, p3) {
            return '<span class="syn-punc">:</span><span class="syn-number">' + p2 + '</span><span class="syn-punc">;</span>';
          });
      }

      if (lang === 'js' || lang === 'tailwind') {
        return code
          .replace(/(\/\/.*)/g, '<span class="syn-comment">$1</span>')
          .replace(/('.*?'|".*?")/g, '<span class="syn-string">$&</span>')
          .replace(/\b(module|exports|const|var|let|return|function|theme|extend)\b/g, '<span class="syn-kwd">$1</span>')
          .replace(/(\b\d+\b)/g, '<span class="syn-number">$1</span>');
      }

      return code;
    }

    var rawExportContent = "";
    var codeEditor = document.getElementById("codeEditor");


    // IMPORTANT:
    // L'UI ne doit jamais dépendre de la structure interne de aliasTo.
    // Elle affiche uniquement un label calculé par getAliasLabel().

    // Fonction pour déterminer la catégorie d'un token sémantique
    // ✅ CORRECTION : action.primary.* et action.secondary.* sont des tokens SÉMANTIQUES purs
    // Les autres tokens sémantiques peuvent pointer vers d'autres catégories (gray, system, etc.)
    function getCategoryFromSemanticKey(semanticKey) {
      var categoryMap = {
        'bg.canvas': 'gray',
        'bg.surface': 'gray',
        'bg.elevated': 'gray',
        'bg.muted': 'gray',
        'bg.inverse': 'gray',
        'text.primary': 'gray',
        'text.secondary': 'gray',
        'text.muted': 'gray',
        'text.inverse': 'gray',
        'text.disabled': 'gray',
        'border.default': 'gray',
        'border.muted': 'gray',
        // ✅ CORRECTION : action.primary.* et action.secondary.* sont UNIQUEMENT sémantiques
        'action.primary.default': 'semantic',
        'action.primary.hover': 'semantic',
        'action.primary.active': 'semantic',
        'action.primary.disabled': 'semantic',
        'action.primary.contrastText': 'semantic',
        'action.secondary.default': 'semantic',
        'action.secondary.hover': 'semantic',
        'action.secondary.active': 'semantic',
        'action.secondary.disabled': 'semantic',
        'action.secondary.contrastText': 'semantic',
        // Les status.* sont des alias vers system.*, donc catégorie system
        'status.success': 'system',
        'status.warning': 'system',
        'status.error': 'system',
        'status.info': 'system',
        'status.success.contrastText': 'system',
        'status.warning.contrastText': 'system',
        'status.error.contrastText': 'system',
        'status.info.contrastText': 'system',
        'radius.sm': 'radius',
        'radius.md': 'radius',
        'space.sm': 'spacing',
        'space.md': 'spacing',
        'font.size.base': 'typography',
        'font.weight.base': 'typography'
      };
      return categoryMap[semanticKey] || 'semantic';
    }

    // Helpers pour harmoniser l'affichage de tous les types de tokens
    function getTokenDisplayValue(token) {
      if (token === null || token === undefined) return "";

      // ✅ FIX: Vérifier d'abord si c'est un token multi-mode
      if (typeof token === 'object' && token.modes) {
        // Déterminer le mode actif
        var activeMode = 'light'; // Par défaut
        // TODO: Récupérer le mode actif depuis l'UI si disponible
        var modeData = token.modes[activeMode] || token.modes.light || {};
        return modeData.resolvedValue || "";
      }

      // Pour les tokens sémantiques modernes (objets avec resolvedValue)
      if (typeof token === 'object' && token.resolvedValue !== undefined) {
        // 🔥 CORRECTION : Si un alias existe et resolvedValue semble corrompu, résoudre depuis primitives
        if (token.aliasTo && typeof token.aliasTo === 'object' && token.aliasTo.collection && token.aliasTo.key) {
          var resolved = token.resolvedValue;
          // Si resolvedValue est #000000 (potentiellement corrompu), tenter de résoudre l'alias
          if (resolved === '#000000' || resolved === '#FFFFFF' || resolved === '0' || resolved === 0) {
            if (typeof currentTokens !== 'undefined' && currentTokens) {
              var collection = token.aliasTo.collection;
              var key = token.aliasTo.key;

              if (currentTokens[collection] && currentTokens[collection][key]) {
                return currentTokens[collection][key];
              }
            }
          }
        }

        // S'assurer que resolvedValue est une valeur scalaire
        var resolved = token.resolvedValue;
        if (typeof resolved === 'string' || typeof resolved === 'number') {
          return resolved;
        }
        // Si c'est un objet, essayer d'extraire une valeur utile
        if (resolved !== null && typeof resolved === 'object' && resolved.value !== undefined) {
          return resolved.value;
        }
        console.warn('⚠️ getTokenDisplayValue: resolvedValue non scalaire pour token:', token);
        return ""; // Valeur par défaut si rien ne marche
      }
      // Pour les tokens primitifs (valeurs directes)
      return token;
    }

    function getTokenColorValue(token) {
      if (token === null || token === undefined) return "#000000";
      // Pour les tokens sémantiques modernes
      if (typeof token === 'object' && token.resolvedValue !== undefined) {
        // 🔥 CORRECTION : Si un alias existe, résoudre la couleur depuis les primitives
        if (token.aliasTo && typeof token.aliasTo === 'object' && token.aliasTo.collection && token.aliasTo.key) {
          // Tenter de résoudre depuis currentTokens
          if (typeof currentTokens !== 'undefined' && currentTokens) {
            var collection = token.aliasTo.collection;
            var key = token.aliasTo.key;

            if (currentTokens[collection] && currentTokens[collection][key]) {
              var primitiveValue = currentTokens[collection][key];
              if (typeof primitiveValue === 'string' && primitiveValue.startsWith('#')) {
                return primitiveValue;
              }
            }
          }
        }

        // Fallback vers resolvedValue
        var resolved = token.resolvedValue;
        if (typeof resolved === 'string' || typeof resolved === 'number') {
          return resolved;
        }
        // Si c'est un objet, essayer d'extraire une valeur utile
        if (resolved !== null && typeof resolved === 'object' && resolved.value !== undefined) {
          return resolved.value;
        }
        return "#000000"; // Valeur par défaut pour les couleurs
      }
      // Pour les tokens primitifs
      return token;
    }

    // Helper pour détecter si une valeur est une couleur hex
    function isHexColor(value) {
      if (typeof value !== "string") return false;
      return /^#([0-9a-fA-F]{3}){1,2}$/.test(value.trim());
    }

    // Helper pour récupérer une valeur "couleur" fiable
    function getResolvedStringValue(token) {
      var v = getTokenDisplayValue(token);
      return (v === null || v === undefined) ? "" : String(v);
    }

    // Helpers pour les badges d'alias (propres, sans HTML)
    function formatAliasLabel(aliasTo) {
      return 'ALIAS';
    }

    function formatAliasTooltip(aliasTo) {
      if (!aliasTo) return 'unknown';
      if (typeof aliasTo === 'string') return aliasTo;
      if (aliasTo.variableId) return aliasTo.variableId;
      if (aliasTo.collection && aliasTo.key) return aliasTo.collection + '/' + aliasTo.key;
      return 'unknown';
    }

    // Renderer unifié pour toutes les rows de tokens
    function renderTokenRow({ key, value, isColorCategory, isSemanticToken, isLocked, isCustomLib, activeCategory, hasColorTableColumn }) {
      // Créer la row
      var row = document.createElement('tr');
      row.className = 'token-row';

      // Colonne visuelle (couleur) pour semantic et catégories de couleur
      // On affiche la colonne si hasColorTableColumn est vrai pour maintenir l'alignement
      if (hasColorTableColumn) {
        var visualCell = document.createElement('td');
        var colorValue = getTokenColorValue(value);

        // Détection intelligente : est-ce une couleur ?
        var isActuallyColor = isColorCategory || isHexColor(colorValue);

        if (isActuallyColor) {
          var swatch = document.createElement('div');
          swatch.className = 'color-swatch';
          swatch.style.backgroundColor = colorValue;
          visualCell.appendChild(swatch);
        }

        row.appendChild(visualCell);
      }

      // Colonne nom
      var nameCell = document.createElement('td');
      nameCell.className = 'token-name';

      var displayName = activeCategory + "-" + key;
      if (activeCategory === "semantic" || isSemanticToken) {
        var figmaName = getSemanticVariableName(key, currentNaming);
        displayName = key;
        nameCell.title = figmaName; // garde l'info sans polluer l'UI
      }

      // 🔥 HARMONISATION : Affichage standard pour tous les tokens (y compris semantic)
      nameCell.textContent = displayName;
      row.appendChild(nameCell);

      // Colonne valeur
      var valueCell = document.createElement('td');
      valueCell.className = 'token-value-cell';

      // Input pour la valeur
      var input = document.createElement('input');
      input.className = 'token-value-input';
      input.type = 'text';
      input.readOnly = true;

      // Valeur propre (jamais de HTML)
      var resolvedValue = getTokenDisplayValue(value);
      input.value = resolvedValue || '';

      // Gestion de l'édition
      if (isSemanticToken || activeCategory === "semantic" || isLocked) {
        input.classList.add('locked');
        input.disabled = true;
      } else {
        input.classList.add('editable');
        input.setAttribute('data-token-key', key);
        input.readOnly = false;
      }

      valueCell.appendChild(input);

      if (typeof value === 'object' && value.aliasTo) {
        // Ajouter le tooltip pour info mais pas de badge visuel
        input.title = formatAliasTooltip(value.aliasTo);

        // Indicateur d'ajustement conservé car utile
        if (value.isAdjusted) {
          var adjBadge = document.createElement('span');
          adjBadge.className = 'adj-badge';
          adjBadge.textContent = 'AJUSTÉ';
          adjBadge.style.background = 'rgba(59, 130, 246, 0.2)';
          adjBadge.style.color = '#3B82F6';
          adjBadge.style.padding = '2px 4px';
          adjBadge.style.borderRadius = '3px';
          adjBadge.style.fontSize = '9px';
          adjBadge.style.fontWeight = '700';
          adjBadge.style.marginLeft = '4px';
          adjBadge.style.border = '1px solid #3B82F6';
          adjBadge.title = "Cette couleur a été ajustée automatiquement pour garantir l'accessibilité ou la hiérarchie visuelle.";
          valueCell.appendChild(adjBadge);
        }
      }

      row.appendChild(valueCell);

      // Colonne actions (si applicable)
      if (isCustomLib && !isSemanticToken && activeCategory !== "semantic") {
        var actionCell = document.createElement('td');
        actionCell.style.textAlign = 'center';

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon';
        deleteBtn.onclick = function () { deleteToken(key); };
        deleteBtn.title = 'Delete';
        deleteBtn.style.color = 'var(--poly-error)';
        deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';

        actionCell.appendChild(deleteBtn);
        row.appendChild(actionCell);
      }

      return row;
    }

    function getAliasLabel(aliasTo) {
      if (!aliasTo) return null;

      // Cas principal : aliasTo est un ID Figma (string)
      if (typeof aliasTo === 'string') {
        return `ALIAS → ${aliasTo}`;
      }

      // Cas legacy / migration
      if (typeof aliasTo === 'object') {
        if (aliasTo.variableId) {
          return `ALIAS → ${aliasTo.variableId}`;
        }
        if (aliasTo.collection && aliasTo.key) {
          return `ALIAS → ${aliasTo.collection}/${aliasTo.key}`;
        }
      }

      return 'ALIAS → unknown';
    }

    function formatValueForDisplay(value) {
      if (value === null || value === undefined) {
        return "";
      }

      // Extraire la valeur d'affichage (harmonisé pour tous les types de tokens)
      var displayValue = getTokenDisplayValue(value);

      // Gestion des alias pour les tokens sémantiques
      var aliasBadge = "";
      if (typeof value === 'object' && value.aliasTo) {
        var aliasLabel = getAliasLabel(value.aliasTo);
        if (aliasLabel) {
          // Log propre pour debug
          console.log('[UI_ALIAS]', {
            token: value,
            aliasTo: value.aliasTo,
            aliasLabel: aliasLabel
          });

          // Échapper le contenu pour éviter tout problème HTML
          var escapedLabel = aliasLabel.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          aliasBadge = " <span class='alias-badge' style='background: var(--poly-accent); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;'>" + escapedLabel + "</span>";
        }
      }

      // Si c'est un objet RGB, convertir en hex
      if (typeof displayValue === 'object' && displayValue.r !== undefined && displayValue.g !== undefined && displayValue.b !== undefined) {
        // Conversion RGB vers hex (simple)
        var r = Math.round(displayValue.r * 255);
        var g = Math.round(displayValue.g * 255);
        var b = Math.round(displayValue.b * 255);
        displayValue = '#' + [r, g, b].map(function (x) {
          var hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
      }

      // Pour les autres objets, afficher JSON (garde-fou)
      if (typeof displayValue === 'object') {
        return JSON.stringify(displayValue) + aliasBadge;
      }

      // Pour les valeurs primitives
      return String(displayValue) + aliasBadge;
    }

    // ============================================
    // EXPORT ENGINE - PHASE 1: NORMALISATION
    // ============================================

    /**
     * Normalise les tokens pour l'export uniquement (fonction pure).
     * Supporte le format "wrapped" (currentTokens.primitives) et "flat" (brand/gray/... au top level).
     * @param {Object} tokens - Tokens bruts
     * @returns {Object} Nouvel objet normalisé { primitives: {}, semantic: {} }
     */
    function normalizeTokensForExport(tokens) {
      if (!tokens) return { primitives: {}, semantic: {} };

      // Nouvel objet pour respecter l'immutabilité de currentTokens
      var normalized = {
        primitives: {},
        semantic: tokens.semantic || {}
      };

      // Liste exhaustive des catégories de primitives traitées par le moteur
      var knownCategories = ["brand", "system", "gray", "spacing", "radius", "typography", "border"];

      // 1. Détection du format & Extraction des primitives
      if (tokens.primitives && typeof tokens.primitives === 'object') {
        // Format A: Wrapped
        knownCategories.forEach(function (cat) {
          if (tokens.primitives[cat]) {
            normalized.primitives[cat] = Object.assign({}, tokens.primitives[cat]);
          }
        });
      } else {
        // Format B: Flat
        knownCategories.forEach(function (cat) {
          if (tokens[cat] && typeof tokens[cat] === 'object' && cat !== 'semantic') {
            normalized.primitives[cat] = Object.assign({}, tokens[cat]);
          }
        });
      }

      // Sécurité : S'assurer que chaque catégorie existe au moins comme objet vide
      knownCategories.forEach(function (cat) {
        if (!normalized.primitives[cat]) {
          normalized.primitives[cat] = {};
        }
      });

      return normalized;
    }

    /**
     * Mini test de cohérence pour l'export (Console Warn uniquement)
     */
    function assertExportHasPrimitivesWhenAvailable(normalized, entries) {
      var primitiveCountInTokens = 0;
      for (var cat in normalized.primitives) {
        primitiveCountInTokens += Object.keys(normalized.primitives[cat]).length;
      }

      var primitiveCountInEntries = entries.filter(e => e.group === 'primitive').length;

      if (primitiveCountInTokens > 0 && primitiveCountInEntries === 0) {
        console.warn("⚠️ [Export Engine] Mismatch détecté : Des primitives existent en entrée mais aucune n'a été générée dans l'export.");
      }
    }

    /**
     * Convertit une valeur en scalaire exportable
     * @param {*} v - Valeur à convertir
     * @returns {string|number|null} Valeur scalaire ou null si impossible
     */
    function toScalar(v) {
      if (v === null || v === undefined) return null;
      if (typeof v === "string") return v;
      if (typeof v === "number") return v;
      if (typeof v === "boolean") return v ? 1 : 0;
      return null; // objets/arrays => interdit
    }

    /**
     * Normalise la valeur d'une ExportEntry pour l'export développeur
     * Préserve les alias var(--...) et ajoute les unités CSS correctes pour les FLOAT
     * @param {Object} entry - ExportEntry avec key, value, type, category, etc.
     * @returns {*} Valeur normalisée
     */
    function normalizeExportEntryValue(entry) {
      // entry: { key, value, type, category, group, ... }
      // type peut être "COLOR" ou "FLOAT" (notamment pour semantic via SEMANTIC_TYPE_MAP)
      var v = entry.value;

      // 1) Ne jamais casser les alias var(--...) si déjà présents
      if (typeof v === "string" && v.trim().startsWith("var(--")) {
        return v.trim();
      }

      // 2) Normaliser les valeurs null/undefined
      if (v === null || v === undefined) {
        return "";
      }

      // 3) Normaliser les couleurs
      if (entry.type === "COLOR" || (typeof v === "string" && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v.trim()))) {
        // Normaliser le format hex (majuscules)
        var hexMatch = v.trim().match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i);
        if (hexMatch) {
          var hex = hexMatch[1];
          // Convertir #RGB en #RRGGBB
          if (hex.length === 3) {
            hex = hex.split('').map(function (c) { return c + c; }).join('');
          }
          return "#" + hex.toUpperCase();
        }
        // Garder les autres formats (rgb(), rgba(), var(), etc.)
        return v.trim();
      }

      // 4) Normaliser les FLOAT numériques (ou strings numériques) en unités CSS selon le domaine
      var isNumeric = (typeof v === "number") || (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim()));
      if (entry.type === "FLOAT" && isNumeric) {
        var n = typeof v === "number" ? v : parseFloat(v.trim());

        // Vérifier si déjà une unité CSS
        if (typeof v === "string" && /^-?\d+(\.\d+)?(px|rem|em|pt|%)$/.test(v.trim())) {
          return v.trim(); // Garder l'unité existante
        }

        // Heuristique basée sur la catégorie OU la key
        var k = (entry.key || "").toLowerCase();
        var c = (entry.category || "").toLowerCase();

        var isFontWeight = k.includes("weight") || ["light", "normal", "medium", "semibold", "bold", "extrabold", "black", "100", "200", "300", "400", "500", "600", "700", "800", "900"].includes(k);
        var isFontSize = (c === "typography" || k.includes("font-size") || k.includes("font.size") || k.includes("fontsize")) && !isFontWeight;
        var isRadius = c === "radius" || k.includes("radius") || k.includes("border-radius");
        var isSpacing = c === "spacing" || k.includes("space") || k.includes("spacing") || k.includes("padding") || k.includes("margin") || k.includes("gap");
        var isLineHeight = k.includes("line-height") || k.includes("lineheight");
        var isLetterSpacing = k.includes("letter-spacing") || k.includes("letterspacing");

        if (isFontWeight) {
          // Font weight : nombre entier sans unité
          return Math.round(n);
        }
        if (isFontSize) {
          // Font size : convertir px en rem (base 16)
          if (n === 0) return "0";
          var rem = (n / 16).toFixed(3).replace(/\.?0+$/, ""); // Enlever les zéros inutiles
          return rem + "rem";
        }
        if (isLineHeight) {
          // Line height : peut être sans unité (multiplier) ou en rem
          if (n < 5) {
            return n.toString(); // Multiplier (ex: 1.5)
          } else {
            return (n / 16).toFixed(3).replace(/\.?0+$/, "") + "rem";
          }
        }
        if (isLetterSpacing) {
          // Letter spacing : généralement en em
          return (n / 1000).toFixed(3).replace(/\.?0+$/, "") + "em"; // Convertir de millième d'em
        }
        if (isRadius || isSpacing) {
          // Radius et spacing : px
          if (n === 0) return "0";
          return Math.round(n) + "px";
        }

        // Fallback : nombre sans unité pour autres cas
        return n.toString();
      }

      // 5) Normaliser les strings (trim, échapper si nécessaire)
      if (typeof v === "string") {
        var trimmed = v.trim();
        // Échapper les guillemets pour JSON si nécessaire
        if (trimmed.includes('"') || trimmed.includes('\n')) {
          return JSON.stringify(trimmed);
        }
        return trimmed;
      }

      // 6) Pour tout autre type, convertir en string
      return String(v);
    }

    /**
     * Convertit un aliasTo en référence string stable pour l'export
     * @param {object|string} aliasTo - Objet aliasTo ou string legacy
     * @param {Object} options - Options d'export (semanticPrefix, primitivePrefix)
     * @returns {string} Référence CSS comme "var(--primitive-css-name)" ou null
     */
    function aliasToStringRef(aliasTo, options) {
      if (!aliasTo) return null;
      options = options || {};

      var preferAliasVar = options.preferAliasVar !== false; // Par défaut true

      var targetName = null;
      var semanticPrefix = options.semanticPrefix || "semantic-";
      var primitivePrefix = options.primitivePrefix || "";

      // Format normalisé actuel : { cssName, collection, key, variableId }
      if (typeof aliasTo === 'object' && aliasTo.cssName) {
        targetName = aliasTo.cssName;
      }
      // Format intermédiaire : { collection, key }
      else if (typeof aliasTo === 'object' && aliasTo.collection && aliasTo.key) {
        var collectionPrefix = {
          // Catégories canoniques (nouvelles)
          "brand": "brand", "system": "system", "gray": "gray", "grey": "gray",
          "spacing": "spacing", "radius": "radius", "typography": "typography",
          // Noms complets legacy (à normaliser)
          "Brand Colors": "brand", "System Colors": "system",
          "Grayscale": "gray", "GreyScale": "gray", "Gray Scale": "gray",
          "Border Radius": "radius", "Spacing": "spacing"
        }[aliasTo.collection] || aliasTo.collection.toLowerCase().replace(/\s+/g, '-');

        var keyPart = collectionPrefix + "-" + aliasTo.key.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        targetName = primitivePrefix ? (primitivePrefix + keyPart) : keyPart;
      }
      // Alias vers semantic : utiliser le préfixe configuré ou défaut
      else if (typeof aliasTo === 'object' && aliasTo.semanticKey) {
        // Utiliser getLibrarySpecificCssName si disponible pour les noms conformes
        var library = options.library || options.naming || 'tailwind';
        if (typeof getLibrarySpecificCssName === 'function') {
          targetName = getLibrarySpecificCssName(aliasTo.semanticKey, library);
        } else {
          targetName = semanticPrefix + aliasTo.semanticKey.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        }
      }

      // Si preferAliasVar est true, retourner var(--targetName)
      if (targetName && preferAliasVar) {
        return "var(--" + targetName + ")";
      }

      // Sinon retourner juste le nom (pour compatibilité)
      return targetName;
    }

    /**
     * Trouve une primitive correspondant à une valeur scalaire (couleur, nombre, etc.)
     * @param {any} searchValue - Valeur à rechercher (ex: "#FF0000" ou 16)
     * @param {Object} primitivesObj - Objet contenant les primitives organisées par catégorie
     * @param {string|string[]} preferredCategories - Catégories prioritaires (facultatif)
     * @returns {Object|null} { category, key } ou null si non trouvé
     */
    function findPrimitiveByValue(searchValue, primitivesObj, preferredCategories) {
      if (searchValue === null || searchValue === undefined || !primitivesObj) return null;

      // Normalisation pour la recherche
      var isColor = typeof searchValue === "string" && isHexColor(searchValue);
      var normalizedSearch = isColor ? searchValue.trim().toUpperCase() : searchValue;

      // Si c'est une couleur hexa courte, l'étendre
      if (isColor && normalizedSearch.length === 4) {
        normalizedSearch = "#" + normalizedSearch[1] + normalizedSearch[1] +
          normalizedSearch[2] + normalizedSearch[2] +
          normalizedSearch[3] + normalizedSearch[3];
      }

      // Préparer les catégories à parcourir
      var allCategories = Object.keys(primitivesObj);
      var catsToSearch = [];

      if (preferredCategories) {
        var preferred = Array.isArray(preferredCategories) ? preferredCategories : [preferredCategories];
        // Mettre les préférées au début
        catsToSearch = preferred.filter(c => allCategories.includes(c));
        // Ajouter les autres
        allCategories.forEach(c => {
          if (!catsToSearch.includes(c)) catsToSearch.push(c);
        });
      } else {
        catsToSearch = allCategories;
      }

      // Parcourir les catégories
      for (var i = 0; i < catsToSearch.length; i++) {
        var category = catsToSearch[i];
        var categoryTokens = primitivesObj[category];

        for (var key in categoryTokens) {
          if (!categoryTokens.hasOwnProperty(key)) continue;

          var primitiveValue = categoryTokens[key];
          var scalarValue = toScalar(primitiveValue);

          if (scalarValue === null) continue;

          // Comparaison selon le type
          if (isColor) {
            if (typeof scalarValue === "string" && isHexColor(scalarValue)) {
              var normalizedPrimitive = scalarValue.trim().toUpperCase();
              if (normalizedPrimitive.length === 4) {
                normalizedPrimitive = "#" + normalizedPrimitive[1] + normalizedPrimitive[1] +
                  normalizedPrimitive[2] + normalizedPrimitive[2] +
                  normalizedPrimitive[3] + normalizedPrimitive[3];
              }
              if (normalizedPrimitive === normalizedSearch) {
                return { category: category, key: key };
              }
            }
          } else {
            // Comparaison simple pour les nombres ou autres strings
            if (scalarValue === searchValue) {
              return { category: category, key: key };
            }
          }
        }
      }

      return null;
    }

    /**
     * Résout une valeur sémantique en scalaire
     * @param {Object} semanticToken - Token sémantique (avec resolvedValue, aliasTo, etc.)
     * @param {Object} options - Options d'export (peut contenir primitivesObj)
     * @returns {Object} { value, valueKind, meta }
     */
    function getSemanticScalar(semanticToken, options) {
      var result = {
        value: null,
        valueKind: "unresolved",
        meta: {
          aliasTo: semanticToken.aliasTo || null,
          resolvedFrom: semanticToken.resolvedValue || null
        }
      };

      // RÈGLE D'OR : Si aliasTo existe, retourner une référence string stable
      if (semanticToken.aliasTo) {
        var stringRef = aliasToStringRef(semanticToken.aliasTo, options);
        if (stringRef) {
          result.value = stringRef;
          result.valueKind = "alias";
          result.meta.aliasTo = semanticToken.aliasTo; // Conserver les métadonnées
          return result;
        } else {
          console.warn(`⚠️ Could not generate string reference for aliasTo:`, semanticToken.aliasTo);
          // Fallback vers resolvedValue
        }
      }

      // NOUVELLE RÈGLE : Si resolvedValue est une valeur scalaire, chercher une primitive correspondante (couleurs, spacing, radius)
      var scalarValue = toScalar(semanticToken.resolvedValue);
      if (scalarValue !== null) {
        // Si on a des primitives disponibles pour la recherche
        if (options && options.primitivesObj) {
          // Déterminer les catégories préférées selon le type ou le nom
          var preferredCats = null;
          if (semanticToken.type === "COLOR") preferredCats = ["gray", "brand", "system"];
          else if (semanticToken.type === "FLOAT") {
            var k = (semanticToken.name || "").toLowerCase();
            if (k.includes("radius")) preferredCats = ["radius"];
            else if (k.includes("spacing") || k.includes("space") || k.includes("padding") || k.includes("gap")) preferredCats = ["spacing"];
          }

          var primitiveMatch = findPrimitiveByValue(scalarValue, options.primitivesObj, preferredCats);
          if (primitiveMatch) {
            // Créer un alias automatique vers la primitive trouvée
            var autoAlias = {
              collection: primitiveMatch.category,
              key: primitiveMatch.key
            };
            var stringRef = aliasToStringRef(autoAlias, options);
            if (stringRef) {
              result.value = stringRef;
              result.valueKind = "alias";
              result.meta.aliasTo = autoAlias;
              result.meta.autoGenerated = true; // Marquer comme auto-généré
              console.log(`✅ Auto-alias créé pour ${semanticToken.name || 'token'}: ${scalarValue} → ${primitiveMatch.category}.${primitiveMatch.key}`);
              return result;
            }
          }
        }

        // Si pas de correspondance ou pas de primitives disponibles, utiliser la valeur telle quelle
        result.value = scalarValue;
        result.valueKind = "literal";
        return result;
      }

      // Rien trouvé
      result.value = "";
      result.valueKind = "unresolved";
      console.warn(`⚠️ Unresolved semantic token:`, semanticToken);
      return result;
    }

    /**
     * Fonction helper pour obtenir le nom CSS spécifique à la bibliothèque
     * @param {string} semanticKey - Clé sémantique (ex: 'bg.canvas', 'palette/primary/main')
     * @param {string} library - Nom de la bibliothèque (tailwind, mui, ant, bootstrap)
     * @returns {string} Nom CSS conforme (ex: 'bg-canvas', 'palette-primary-main')
     */
    function getLibrarySpecificCssName(semanticKey, library) {
      // Normaliser le nom de la bibliothèque
      var lib = library.toLowerCase().trim();
      if (lib === 'shadcn') lib = 'tailwind';

      // Utiliser SEMANTIC_NAME_MAP si disponible (défini dans code.js)
      if (typeof window !== 'undefined' && window.SEMANTIC_NAME_MAP && window.SEMANTIC_NAME_MAP[lib]) {
        var mapping = window.SEMANTIC_NAME_MAP[lib];
        if (mapping[semanticKey]) {
          return mapping[semanticKey];
        }
      }

      // Fallback : remplacer points, slashes et $ par des tirets
      var mappedName = semanticKey.replace(/[.$/]/g, '-');

      return mappedName;
    }

    /**
     * Construit les ExportEntries normalisées depuis les tokens courants
     * @param {Object} currentTokens - Tokens avec primitives et semantic
     * @param {Object} options - Options d'export
     * @returns {Array} Tableau d'ExportEntries
     */
    function buildExportEntries(currentTokens, options) {
      var entries = [];
      var defaults = {
        preferAliasVar: true,
        includePrimitives: true,
        includeSemantic: true,
        semanticPrefix: "semantic-",
        primitivePrefix: ""
      };

      options = Object.assign({}, defaults, options);

      // Validation d'entrée
      if (!currentTokens) {
        console.warn("⚠️ buildExportEntries: no tokens provided");
        return entries;
      }

      // 1. Traiter les primitives
      var primitivesObj = currentTokens.primitives;

      // Fallback robuste : si absent mais qu'on a des catégories top-level (même si on a normalisé avant)
      if (!primitivesObj) {
        var known = ["brand", "system", "gray", "spacing", "radius", "typography", "border"];
        var foundFlat = false;
        known.forEach(k => { if (currentTokens[k]) foundFlat = true; });
        if (foundFlat) {
          // Créer une vue temporaire pour buildExportEntries si ce n'était pas normalisé
          primitivesObj = {};
          known.forEach(k => { if (currentTokens[k]) primitivesObj[k] = currentTokens[k]; });
        }
      }

      if (options.includePrimitives && primitivesObj) {
        for (var category in primitivesObj) {
          if (!primitivesObj.hasOwnProperty(category)) continue;

          var categoryTokens = primitivesObj[category];
          for (var key in categoryTokens) {
            if (!categoryTokens.hasOwnProperty(key)) continue;

            var primitiveValue = categoryTokens[key];
            var scalarValue = toScalar(primitiveValue);

            if (scalarValue === null) {
              console.warn(`⚠️ Skipping primitive ${category}/${key}: not scalar value`);
              continue;
            }

            // Utiliser le préfixe primitif si fourni, sinon utiliser category-key
            var primitiveKey = options.primitivePrefix ?
              (options.primitivePrefix + category + "-" + key) :
              (category + "-" + key);

            entries.push({
              key: primitiveKey,
              group: "primitive",
              category: category,
              type: typeof scalarValue === "number" ? "FLOAT" : "STRING",
              raw: primitiveValue,
              value: scalarValue,
              valueKind: "literal",
              meta: {}
            });
          }
        }
      }

      // 2. Traiter les sémantiques
      if (options.includeSemantic && currentTokens.semantic) {
        var semanticOptions = Object.assign({}, options, { primitivesObj: primitivesObj });
        var library = options.library || options.naming || 'tailwind';
        var semanticRoot = currentTokens.semantic;

        // Fonction interne pour traiter un ensemble de tokens sémantiques
        function processSemanticSet(tokenSet, themeMode = null) {
          for (var semanticKey in tokenSet) {
            if (!tokenSet.hasOwnProperty(semanticKey)) continue;

            var semanticToken = tokenSet[semanticKey];
            var scalarResult = getSemanticScalar(semanticToken, semanticOptions);

            if (scalarResult.value === null) {
              console.warn(`⚠️ Skipping semantic ${semanticKey}: cannot convert to scalar`);
              continue;
            }

            // 1. Generate STANDARD ENTRY (all libraries get this)
            // Rules 3 & 7: Standard Layer is the primary source
            var standardName = semanticKey.replace(/[.$/]/g, '-');

            entries.push({
              key: standardName,
              group: "semantic",
              category: "standard",
              theme: themeMode,
              type: semanticToken.type || "UNKNOWN",
              raw: semanticToken,
              value: scalarResult.value,
              valueKind: scalarResult.valueKind,
              aliasTo: scalarResult.meta.aliasTo || null,  // Ajouter l'info d'alias
              meta: scalarResult.meta
            });

            // 2. Generate LIBRARY-SPECIFIC ALIAS (Rule 7)
            // If the library is not 'standard' or 'tailwind' (which matches standard), 
            // and has a specific mapping, add an alias to the standard token.
            if (library !== 'standard' && library !== 'tailwind') {
              var libName = getLibrarySpecificCssName(semanticKey, library);
              if (libName && libName !== standardName) {
                entries.push({
                  key: libName,
                  group: "semantic",
                  category: library, // Marked as library-specific
                  theme: themeMode,
                  type: semanticToken.type || "UNKNOWN",
                  raw: semanticToken,
                  value: "var(--" + standardName + ")",
                  valueKind: "alias",
                  meta: { aliasTo: standardName }
                });
              }
            }
          }
        }

        if (semanticRoot.modes) {
          // Mode multidimensionnel (Light + Dark)
          for (var mode in semanticRoot.modes) {
            processSemanticSet(semanticRoot.modes[mode], mode);
          }
        } else {
          // Mode standard (Plat)
          processSemanticSet(semanticRoot);
        }
      }

      // 3. Validation HARD: aucun "[object Object]" ET aucun objet dans les valeurs autorisé
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (typeof entry.value === "string" && entry.value.includes("[object Object]")) {
          throw new Error(`🚨 CRITICAL: Entry ${entry.key} contains "[object Object]" - normalization failed`);
        }
        if (typeof entry.value === "object") {
          throw new Error(`🚨 CRITICAL: Entry ${entry.key} has object value - exports must be scalar only: ${JSON.stringify(entry.value)}`);
        }
      }

      console.log(`✅ ExportEntries built: ${entries.length} entries (${entries.filter(e => e.group === 'primitive').length} primitives, ${entries.filter(e => e.group === 'semantic').length} semantic)`);
      return entries;
    }

    // ============================================
    // EXPORT ENGINE - PHASE 2: FORMATTERS
    // ============================================

    /**
     * Formate les ExportEntries en CSS Variables (:root)
     * @param {Array} entries - ExportEntries normalisées
     * @param {Object} options - Options de formatage
     * @returns {string} Code CSS
     */
    function formatCSS(entries, options) {
      var defaults = {
        indent: "  ",
        sortByCategory: true,
        includeComments: true
      };
      options = Object.assign({}, defaults, options);

      var lines = [];

      // Helper pour nettoyer les clés (supprimer espaces, slashes, etc.)
      function sanitizeKey(key) {
        return key.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }

      // En-tête
      if (options.includeComments) {
        lines.push("/**\n * Design Tokens - CSS Variables\n * Robust & Consistent Export\n */\n");
      }

      // 1. :root - Primitives ONLY (Rule 2)
      lines.push(":root {");
      var primitives = entries.filter(e => e.group === 'primitive');
      if (options.sortByCategory) {
        primitives.sort((a, b) => (a.category + a.key).localeCompare(b.category + b.key));
      }
      var currentCategory = null;
      primitives.forEach(e => {
        if (options.includeComments && options.sortByCategory && e.category !== currentCategory) {
          if (currentCategory !== null) lines.push("");
          currentCategory = e.category;
          lines.push(options.indent + "/* " + e.category.toUpperCase() + " */");
        }
        lines.push(options.indent + "--" + sanitizeKey(e.key) + ": " + e.value + ";");
      });
      lines.push("}\n");

      // Helper function to format a block
      function pushBlock(selector, filterFn, comment) {
        var blockEntries = entries.filter(filterFn);
        if (blockEntries.length > 0) {
          if (comment) lines.push("/* " + comment + " */");
          lines.push(selector + " {");
          blockEntries.sort((a, b) => a.key.localeCompare(b.key)).forEach(e => {
            lines.push(options.indent + "--" + sanitizeKey(e.key) + ": " + e.value + ";");
          });
          lines.push("}\n");
        }
      }

      // 2. Light Theme - Standard Layer (Rule 3)
      pushBlock("html[data-theme='light']", e => e.group === 'semantic' && e.category === 'standard' && (e.theme === 'light' || e.theme === null), "Standard Semantic Layer - Light");

      // 3. Dark Theme - Standard Layer (Rule 3)
      pushBlock("html[data-theme='dark']", e => e.group === 'semantic' && e.category === 'standard' && e.theme === 'dark', "Standard Semantic Layer - Dark");

      // 4. Compatibility Aliases (Rule 7)
      // We group them by library category (e.g. mui, chakra)
      var libraries = [...new Set(entries.filter(e => e.group === 'semantic' && e.category !== 'standard').map(e => e.category))];
      libraries.forEach(lib => {
        // Light aliases
        pushBlock("html[data-theme='light']", e => e.group === 'semantic' && e.category === lib && (e.theme === 'light' || e.theme === null), lib.toUpperCase() + " Compatibility Aliases - Light");
        // Dark aliases
        pushBlock("html[data-theme='dark']", e => e.group === 'semantic' && e.category === lib && e.theme === 'dark', lib.toUpperCase() + " Compatibility Aliases - Dark");
      });

      return lines.join("\n");
    }

    /**
     * Formate les ExportEntries en CSS Variables avec structure plate (sans hiérarchie)
     * @param {Array} entries - ExportEntries normalisées
     * @param {Object} options - Options de formatage
     * @returns {string} Code CSS
     */
    function formatCSSFlat(entries, options) {
      var defaults = {
        indent: "  "
      };
      options = Object.assign({}, defaults, options);

      var lines = [":root {"];

      // Trier par clé alphabétique
      var sortedEntries = entries.sort((a, b) => a.key.localeCompare(b.key));

      // Générer les variables avec noms simplifiés (sans préfixes de catégorie)
      for (var i = 0; i < sortedEntries.length; i++) {
        var entry = sortedEntries[i];
        var cssValue = entry.value;

        // Simplifier la clé : enlever les préfixes de catégorie
        var flatKey = entry.key
          .replace(/^(semantic-|primitive-)/, "")
          .replace(/^(brand-|system-|gray-|spacing-|radius-|typography-)/, "");

        lines.push(options.indent + "--" + flatKey + ": " + cssValue + ";");
      }

      lines.push("}");

      return lines.join("\n");
    }

    /**
     * Formate les ExportEntries en JSON Design Tokens
     * @param {Array} entries - ExportEntries normalisées
     * @param {Object} options - Options de formatage
     * @returns {string} Code JSON
     */
    function formatJSON(entries, options) {
      var defaults = {
        pretty: true,
        includeMetadata: false,
        includeComments: false // JSON ne supporte pas les commentaires, mais on peut ajouter un champ $comment
      };
      options = Object.assign({}, defaults, options);

      var result = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $comment: "Design Tokens generated by PolyToken plugin. Usage: import tokens from './tokens.json'; const bgColor = tokens.semantic['bg.canvas'];"
      };

      // Helper pour nettoyer les clés
      function sanitizeKey(key) {
        return key.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }

      if (!options.includeMetadata) {
        result.primitives = {};
        result.semantic = {};
      } else {
        result.primitives = {};
        result.semantic = {};
      }

      // Organiser par groupe
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];

        if (entry.group === "primitive") {
          if (!result.primitives[entry.category]) {
            result.primitives[entry.category] = {};
          }
          var cleanKey = sanitizeKey(entry.key.replace(entry.category + "-", ""));
          result.primitives[entry.category][cleanKey] = entry.value;
        } else if (entry.group === "semantic") {
          var semanticKey = sanitizeKey(entry.key.replace(/^semantic-/, ""));
          var target = result.semantic;

          // Si theme présent, on crée une structure modes
          if (entry.theme) {
            if (!result.semantic.modes) result.semantic.modes = {};
            if (!result.semantic.modes[entry.theme]) result.semantic.modes[entry.theme] = {};
            target = result.semantic.modes[entry.theme];
          }

          if (options.includeMetadata) {
            target[semanticKey] = {
              value: entry.value,
              type: entry.type,
              alias: entry.meta && entry.meta.aliasTo ? entry.meta.aliasTo : null
            };
          } else {
            target[semanticKey] = entry.value;
          }
        }
      }

      return options.pretty ?
        JSON.stringify(result, null, 2) :
        JSON.stringify(result);
    }

    /**
     * Formate les ExportEntries en JSON avec structure plate (sans hiérarchie)
     * @param {Array} entries - ExportEntries normalisées
     * @param {Object} options - Options de formatage
     * @returns {string} Code JSON
     */
    function formatJSONFlat(entries, options) {
      var defaults = {
        pretty: true
      };
      options = Object.assign({}, defaults, options);

      var result = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $comment: "Design Tokens (flat structure) generated by PolyToken plugin."
      };

      // Structure plate : toutes les entrées au même niveau
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        // Clé simplifiée sans préfixes de catégorie
        var flatKey = entry.key
          .replace(/^(semantic-|primitive-)/, "")
          .replace(/^(brand-|system-|gray-|spacing-|radius-|typography-|border-)/, "");

        result[flatKey] = entry.value;
      }

      return options.pretty ?
        JSON.stringify(result, null, 2) :
        JSON.stringify(result);
    }

    /**
     * Formate les ExportEntries en variables SCSS
     * @param {Array} entries - ExportEntries normalisées
     * @param {Object} options - Options de formatage
     * @returns {string} Code SCSS
     */
    function formatSCSS(entries, options) {
      var defaults = {
        indent: "",
        sortByCategory: true,
        includeComments: true
      };
      options = Object.assign({}, defaults, options);

      var lines = [];

      // En-tête
      if (options.includeComments) {
        lines.push("// Design Tokens - SCSS Variables\n// Generated by PolyToken plugin\n");
      }

      // Déduplication pour SCSS (on ne veut qu'une seule variable pointant vers la var CSS pour les sémantiques)
      var processedKeys = new Set();
      var sortedEntries = options.sortByCategory ?
        entries.sort((a, b) => (a.category + a.key).localeCompare(b.category + b.key)) :
        entries;

      var currentCategory = null;
      for (var i = 0; i < sortedEntries.length; i++) {
        var entry = sortedEntries[i];

        // Si c'est un token sémantique déjà traité (dans un autre thème), on passe
        if (entry.group === "semantic" && processedKeys.has(entry.key)) continue;
        if (entry.group === "semantic") processedKeys.add(entry.key);

        // Pour les sémantiques, utiliser l'alias vers la primitive si disponible
        var scssValue;
        if (entry.group === "semantic" && entry.aliasTo) {
          // Créer une référence SCSS vers la primitive : $gray-50, $brand-500, etc.
          var aliasCategory = entry.aliasTo.collection || entry.aliasTo.category;
          var aliasKey = entry.aliasTo.key;
          scssValue = "$" + aliasCategory + "-" + aliasKey;
        } else {
          // Pour les primitives, utiliser la valeur directe
          scssValue = entry.value;
        }

        if (options.includeComments && options.sortByCategory && entry.category !== currentCategory) {
          if (currentCategory !== null) lines.push("");
          currentCategory = entry.category;
          lines.push("// " + entry.category.toUpperCase());
        }

        // Nettoyer le nom de la variable SCSS (remplacer tous les caractères non-alphanumériques par un seul tiret)
        var scssVarName = entry.key.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        lines.push(options.indent + "$" + scssVarName + ": " + scssValue + ";");
      }

      return lines.join("\n");
    }

    /**
     * Formate les ExportEntries en variables SCSS avec structure plate
     * @param {Array} entries - ExportEntries normalisées
     * @param {Object} options - Options de formatage
     * @returns {string} Code SCSS
     */
    function formatSCSSFlat(entries, options) {
      var defaults = {
        indent: ""
      };
      options = Object.assign({}, defaults, options);

      var lines = [];

      // Trier par clé alphabétique
      var sortedEntries = entries.sort((a, b) => a.key.localeCompare(b.key));

      // Générer les variables avec noms simplifiés
      for (var i = 0; i < sortedEntries.length; i++) {
        var entry = sortedEntries[i];
        var scssValue = entry.value;

        // Simplifier la clé
        var flatKey = entry.key
          .replace(/^(semantic-|primitive-)/, "")
          .replace(/^(brand-|system-|gray-|spacing-|radius-|typography-)/, "");

        lines.push(options.indent + "$" + flatKey + ": " + scssValue + ";");
      }

      return lines.join("\n");
    }

    /**
     * Formate les ExportEntries en configuration Tailwind
     * @param {Array} entries - ExportEntries normalisées
     * @param {Object} options - Options de formatage
     * @returns {string} Code JavaScript pour tailwind.config.js
     */
    function formatTailwindConfig(entries, options) {
      var defaults = {
        indent: "    ", // 4 espaces pour l'indentation dans module.exports
        includeExtend: true,
        includeComments: true
      };
      options = Object.assign({}, defaults, options);

      var lines = [];

      // Helper pour nettoyer les clés
      function sanitizeKey(key) {
        return key.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }

      // Ajouter en-tête avec documentation
      if (options.includeComments) {
        lines.push("/**");
        lines.push(" * Tailwind CSS Configuration");
        lines.push(" * Generated by PolyToken plugin");
        lines.push(" *");
        lines.push(" * Usage examples:");
        lines.push(" *   <div className=\"bg-bg-canvas\">");
        lines.push(" *   <div className=\"p-primitive-spacing-16\">");
        lines.push(" *   <div className=\"rounded-radius-md\">");
        lines.push(" */");
        lines.push("");
      }

      lines.push("module.exports = {");
      lines.push(options.indent + "theme: {");

      if (options.includeExtend) {
        lines.push(options.indent + options.indent + "extend: {");
      }

      var theme = {};

      // Organiser par type pour Tailwind
      var colorEntries = entries.filter(e => e.category === "brand" || e.category === "system" || e.category === "gray" || (e.group === "semantic" && e.type === "COLOR"));
      var spacingEntries = entries.filter(e => e.category === "spacing" || (e.group === "semantic" && (e.key.includes("space") || e.key.includes("gap") || e.key.includes("padding"))));
      var radiusEntries = entries.filter(e => e.category === "radius" || (e.group === "semantic" && e.key.includes("radius")));
      var typographyEntries = entries.filter(e => e.category === "typography" || (e.group === "semantic" && e.type === "FLOAT" && (e.key.includes("font") || e.key.includes("text"))));
      var borderEntries = entries.filter(e => e.category === "border" || (e.group === "semantic" && e.key.includes("border")));

      // Colors
      if (colorEntries.length > 0) {
        theme.colors = {};
        for (var i = 0; i < colorEntries.length; i++) {
          var entry = colorEntries[i];
          var colorKey = sanitizeKey(entry.group === "primitive" ?
            entry.key.replace(entry.category + "-", "") :
            entry.key.replace(/^semantic-/, ""));

          if (entry.group === "semantic") {
            theme.colors[colorKey] = "var(--" + sanitizeKey(entry.key) + ")";
          } else {
            theme.colors[colorKey] = entry.value;
          }
        }
      }

      // Spacing
      if (spacingEntries.length > 0) {
        theme.spacing = {};
        for (var i = 0; i < spacingEntries.length; i++) {
          var entry = spacingEntries[i];
          var spacingKey = sanitizeKey(entry.group === "primitive" ? entry.key.replace("spacing-", "") : entry.key.replace(/^semantic-/, ""));
          theme.spacing[spacingKey] = entry.group === "semantic" ? "var(--" + sanitizeKey(entry.key) + ")" : entry.value;
        }
      }

      // Border radius
      if (radiusEntries.length > 0) {
        theme.borderRadius = {};
        for (var i = 0; i < radiusEntries.length; i++) {
          var entry = radiusEntries[i];
          var radiusKey = sanitizeKey(entry.group === "primitive" ? entry.key.replace("radius-", "") : entry.key.replace(/^semantic-/, ""));
          theme.borderRadius[radiusKey] = entry.group === "semantic" ? "var(--" + sanitizeKey(entry.key) + ")" : entry.value;
        }
      }

      // Border width
      if (borderEntries.length > 0) {
        theme.borderWidth = {};
        for (var i = 0; i < borderEntries.length; i++) {
          var entry = borderEntries[i];
          var borderKey = sanitizeKey(entry.group === "primitive" ? entry.key.replace("border-", "") : entry.key.replace(/^semantic-/, ""));
          theme.borderWidth[borderKey] = entry.group === "semantic" ? "var(--" + sanitizeKey(entry.key) + ")" : entry.value;
        }
      }

      // Typography - répartir selon le type de token
      if (typographyEntries.length > 0) {
        theme.fontSize = {};
        theme.fontWeight = {};
        theme.lineHeight = {};
        theme.letterSpacing = {};

        for (var i = 0; i < typographyEntries.length; i++) {
          var entry = typographyEntries[i];
          var typoKey = sanitizeKey(entry.group === "primitive" ? entry.key.replace("typography-", "") : entry.key.replace(/^semantic-/, ""));
          typoKey = typoKey.toLowerCase();

          var entryValue = entry.group === "semantic" ? "var(--" + sanitizeKey(entry.key) + ")" : entry.value;

          // Classifier selon le nom de la clé
          if (typoKey.includes("weight")) {
            var weightKey = typoKey.replace(/font-?weight-?/i, "") || "normal";
            theme.fontWeight[weightKey] = entryValue;
          } else if (typoKey.includes("line-height") || typoKey.includes("lineheight") || typoKey.includes("leading")) {
            var lhKey = typoKey.replace(/line-?height-?|leading-?/i, "") || "normal";
            theme.lineHeight[lhKey] = entryValue;
          } else if (typoKey.includes("letter-spacing") || typoKey.includes("letterspacing") || typoKey.includes("tracking")) {
            var lsKey = typoKey.replace(/letter-?spacing-?|tracking-?/i, "") || "normal";
            theme.letterSpacing[lsKey] = entryValue;
          } else {
            // Par défaut, c'est un fontSize
            var sizeKey = typoKey.replace(/font-?size-?/i, "") || "base";
            theme.fontSize[sizeKey] = entryValue;
          }
        }

        // Nettoyer les objets vides
        if (Object.keys(theme.fontSize).length === 0) delete theme.fontSize;
        if (Object.keys(theme.fontWeight).length === 0) delete theme.fontWeight;
        if (Object.keys(theme.lineHeight).length === 0) delete theme.lineHeight;
        if (Object.keys(theme.letterSpacing).length === 0) delete theme.letterSpacing;
      }

      // Construire les lignes du thème avec commentaires
      var themeLines = [];

      // 🔍 DEBUG: Voir ce qu'il y a dans theme
      console.log('🔍 [TAILWIND_DEBUG] theme object:', theme);
      console.log('🔍 [TAILWIND_DEBUG] theme.colors:', theme.colors);
      console.log('🔍 [TAILWIND_DEBUG] Object.keys(theme):', Object.keys(theme));

      if (options.includeComments && Object.keys(theme).length > 0) {
        themeLines.push(options.indent + options.indent + options.indent + "// Theme tokens");
      }

      for (var key in theme) {
        if (!theme.hasOwnProperty(key)) continue;
        var valueStr = JSON.stringify(theme[key], null, 4);
        themeLines.push(options.indent + options.indent + options.indent + key + ": " + valueStr);
      }

      if (options.includeExtend) {
        lines = lines.concat(themeLines);
        lines.push(options.indent + options.indent + "}");
        lines.push(options.indent + "}");
      } else {
        // Sans extend
        var themeStr = JSON.stringify({ theme: theme }, null, 4);
        lines.push(themeStr.substring(1, themeStr.length - 1)); // Enlever les {}
      }

      lines.push("};");

      return lines.join("\n");
    }

    /**
     * Formate les ExportEntries pour export sémantique uniquement
     * @param {Array} entries - ExportEntries normalisées
     * @param {Object} options - Options de formatage
     * @returns {string} Code CSS avec seulement les sémantiques
     */
    function formatSemanticOnly(entries, options) {
      var semanticEntries = entries.filter(e => e.group === "semantic");
      return formatCSS(semanticEntries, options);
    }

    /**
     * Fonction de test rapide pour valider les exports (appelée manuellement)
     * Teste la nouvelle logique d'alias et garantit l'absence de [object Object]
     */
    function runExportTests() {
      console.log("🧪 RUNNING EXPORT TESTS...");

      // Construire un jeu de test représentatif
      var testTokens = {
        primitives: {
          gray: {
            50: "#F9FAFB",
            600: "#4B5563"
          },
          spacing: {
            4: 16
          }
        },
        semantic: {
          "bg.canvas": {
            resolvedValue: "#F9FAFB",
            type: "COLOR",
            aliasTo: { cssName: "gray-50", collection: "Gray", key: "50", variableId: "test-id" }
          },
          "text.primary": {
            resolvedValue: "#030712",
            type: "COLOR"
          },
          "space.small": {
            resolvedValue: 12,
            type: "FLOAT"
          }
        }
      };

      try {
        // Tester buildExportEntries
        var exportEntries = buildExportEntries(testTokens, { preferAliasVar: true });
        console.log("✅ buildExportEntries succeeded:", exportEntries.length, "entries");

        // Tester chaque format
        var css = formatCSS(exportEntries);
        var scss = formatSCSS(exportEntries);
        var json = formatJSON(exportEntries, { pretty: false });
        var tailwind = formatTailwindConfig(exportEntries);

        // Vérifications
        var tests = [
          { name: "CSS contains aliased var", check: css.includes('--semantic-bg.canvas: var(--gray-50);') },
          { name: "SCSS contains aliased var", check: scss.includes('$semantic-bg.canvas: var(--gray-50);') },
          { name: "JSON contains aliased var", check: json.includes('"bg.canvas": "var(--gray-50)"') },
          { name: "Tailwind contains aliased var", check: tailwind.includes('"bg.canvas": "var(--gray-50)"') },
          { name: "No [object Object] in CSS", check: !css.includes('[object Object]') },
          { name: "No [object Object] in SCSS", check: !scss.includes('[object Object]') },
          { name: "No [object Object] in JSON", check: !json.includes('[object Object]') },
          { name: "No [object Object] in Tailwind", check: !tailwind.includes('[object Object]') }
        ];

        var allPassed = true;
        tests.forEach(function (test) {
          if (test.check) {
            console.log("✅", test.name);
          } else {
            console.error("❌", test.name);
            allPassed = false;
          }
        });

        if (allPassed) {
          console.log("🎉 ALL TESTS PASSED!");
        } else {
          console.error("💥 SOME TESTS FAILED!");
        }

        // Afficher les outputs pour inspection
        console.log("📄 CSS Output:", css);
        console.log("📄 JSON Output:", json);

      } catch (e) {
        console.error("💥 TEST FAILED with exception:", e);
      }
    }

    /**
     * Tests runtime pour valider l'intégrité des exports avant génération
     */
    /**
     * Valide la syntaxe CSS
     */
    function validateCSSSyntax(css) {
      var errors = [];
      try {
        // Vérifier les accolades équilibrées
        var openBraces = (css.match(/\{/g) || []).length;
        var closeBraces = (css.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          errors.push("Accolades non équilibrées: " + openBraces + " ouvertures, " + closeBraces + " fermetures");
        }

        // Vérifier les points-virgules dans les règles
        var rules = css.match(/[^;{}]+(?=;|\})/g) || [];
        for (var i = 0; i < rules.length; i++) {
          var rule = rules[i].trim();
          if (rule && !rule.match(/^[^:]+:[^:]+$/)) {
            // Vérifier format propriété:valeur
            if (!rule.includes(':')) {
              errors.push("Règle invalide (manque ':'): " + rule.substring(0, 50));
            }
          }
        }

        // Vérifier les noms de variables CSS valides
        var varMatches = css.match(/var\(--([^)]+)\)/g) || [];
        for (var j = 0; j < varMatches.length; j++) {
          var varName = varMatches[j].match(/--([^)]+)/)[1];
          if (!/^[a-zA-Z0-9_-]+$/.test(varName)) {
            errors.push("Nom de variable CSS invalide: --" + varName);
          }
        }
      } catch (e) {
        errors.push("Erreur de validation CSS: " + e.message);
      }
      return { valid: errors.length === 0, errors: errors };
    }

    /**
     * Valide la syntaxe JSON
     */
    function validateJSONSyntax(json) {
      var errors = [];
      try {
        JSON.parse(json);
      } catch (e) {
        errors.push("JSON invalide: " + e.message);
      }
      return { valid: errors.length === 0, errors: errors };
    }

    /**
     * Génère les définitions TypeScript (.d.ts) pour les exports JSON
     * @param {Array} exportEntries - ExportEntries normalisées
     * @returns {string} Code TypeScript des définitions de types
     */
    function generateTypeScriptDefinitions(exportEntries) {
      var lines = [];
      lines.push("/**");
      lines.push(" * Design Tokens - TypeScript Definitions");
      lines.push(" * Auto-generated from PolyToken plugin");
      lines.push(" * @generated");
      lines.push(" */");
      lines.push("");
      lines.push("export interface DesignTokens {");
      lines.push("  primitives?: {");

      // Grouper par catégorie
      var primitivesByCategory = {};
      var semanticTokens = {};

      for (var i = 0; i < exportEntries.length; i++) {
        var entry = exportEntries[i];
        if (entry.group === "primitive") {
          if (!primitivesByCategory[entry.category]) {
            primitivesByCategory[entry.category] = {};
          }
          var type = entry.type === "COLOR" ? "string" : (entry.type === "FLOAT" ? "number" : "string");
          primitivesByCategory[entry.category][entry.key] = type;
        } else if (entry.group === "semantic") {
          var semanticKey = entry.key.replace(/^semantic-/, "");
          var type = entry.type === "COLOR" ? "string" : (entry.type === "FLOAT" ? "number" : "string");
          semanticTokens[semanticKey] = type;
        }
      }

      // Générer les types pour les primitives
      for (var category in primitivesByCategory) {
        if (primitivesByCategory.hasOwnProperty(category)) {
          lines.push("    " + category + "?: {");
          var categoryTokens = primitivesByCategory[category];
          for (var key in categoryTokens) {
            if (categoryTokens.hasOwnProperty(key)) {
              var cleanKey = key.replace(category + "-", "");
              lines.push("      \"" + cleanKey + "\": " + categoryTokens[key] + ";");
            }
          }
          lines.push("    };");
        }
      }

      lines.push("  };");
      lines.push("  semantic?: {");

      // Générer les types pour les sémantiques
      for (var semanticKey in semanticTokens) {
        if (semanticTokens.hasOwnProperty(semanticKey)) {
          lines.push("    \"" + semanticKey + "\": " + semanticTokens[semanticKey] + ";");
        }
      }

      lines.push("  };");
      lines.push("}");
      lines.push("");
      lines.push("declare const tokens: DesignTokens;");
      lines.push("export default tokens;");

      return lines.join("\n");
    }

    /**
     * Valide la syntaxe JavaScript (basique)
     */
    function validateJSSyntax(js) {
      var errors = [];
      try {
        // Vérifier les accolades/parenthèses équilibrées
        var openBraces = (js.match(/\{/g) || []).length;
        var closeBraces = (js.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          errors.push("Accolades non équilibrées");
        }

        var openParens = (js.match(/\(/g) || []).length;
        var closeParens = (js.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          errors.push("Parenthèses non équilibrées");
        }

        // Vérifier les guillemets équilibrés
        var singleQuotes = (js.match(/'/g) || []).length;
        var doubleQuotes = (js.match(/"/g) || []).length;
        if (singleQuotes % 2 !== 0) {
          errors.push("Guillemets simples non équilibrés");
        }
        if (doubleQuotes % 2 !== 0) {
          errors.push("Guillemets doubles non équilibrés");
        }

        // Vérifier module.exports ou export
        if (!js.includes('module.exports') && !js.includes('export')) {
          errors.push("Aucune exportation détectée (module.exports ou export manquant)");
        }
      } catch (e) {
        errors.push("Erreur de validation JS: " + e.message);
      }
      return { valid: errors.length === 0, errors: errors };
    }

    function runExportIntegrityTests(normalized) {
      // Utiliser les tokens normalisés passés en param ou se baser sur le global
      var tokens = normalized || (typeof currentTokens !== 'undefined' ? normalizeTokensForExport(currentTokens) : null);
      if (!tokens) return;

      console.log("🔍 RUNNING EXPORT INTEGRITY TESTS...");

      var tests = [];
      var allPassed = true;

      // Test 1: Primitives non vides si elles existent dans les tokens passés
      var hasPrimitivesInTokens = false;
      if (tokens.primitives) {
        for (var cat in tokens.primitives) {
          if (tokens.primitives.hasOwnProperty(cat) && Object.keys(tokens.primitives[cat]).length > 0) {
            hasPrimitivesInTokens = true;
            break;
          }
        }
      }
      tests.push({
        name: "Primitives présentes dans les tokens d'export",
        passed: hasPrimitivesInTokens,
        detail: hasPrimitivesInTokens ? "Primitives trouvées" : "Aucune primitive détectée (vérifier le format flat/wrapped)"
      });

      // Test 2: Aucun objet dans les valeurs sémantiques (anti-[object Object])
      var semanticObjectValues = [];
      if (tokens.semantic) {
        for (var key in tokens.semantic) {
          if (tokens.semantic.hasOwnProperty(key)) {
            var token = tokens.semantic[key];
            if (typeof token === 'object' && token.resolvedValue !== undefined) {
              if (typeof token.resolvedValue === 'object') {
                semanticObjectValues.push(key + ": " + JSON.stringify(token.resolvedValue));
              }
            }
          }
        }
      }
      tests.push({
        name: "Aucun objet dans resolvedValue sémantique",
        passed: semanticObjectValues.length === 0,
        detail: semanticObjectValues.length === 0 ? "OK" : "Objets trouvés: " + semanticObjectValues.join(", ")
      });

      // Test 3: Alias sémantiques ont une structure valide
      var invalidAliasTokens = [];
      if (tokens.semantic) {
        for (var key in tokens.semantic) {
          if (tokens.semantic.hasOwnProperty(key)) {
            var token = tokens.semantic[key];
            if (typeof token === 'object' && token.aliasTo) {
              // Vérifier que aliasTo peut générer une référence string
              var canGenerateRef = false;
              var aliasTo = token.aliasTo;

              if (typeof aliasTo === 'object' && (aliasTo.cssName || (aliasTo.collection && aliasTo.key))) {
                canGenerateRef = true;
              }

              if (!canGenerateRef) {
                invalidAliasTokens.push(key);
              }
            }
          }
        }
      }
      tests.push({
        name: "Alias sémantiques peuvent générer des références",
        passed: invalidAliasTokens.length === 0,
        detail: invalidAliasTokens.length === 0 ? "OK" : "Alias invalides: " + invalidAliasTokens.join(", ")
      });

      // Test 4: Validation syntaxique du code exporté (si disponible)
      if (typeof rawExportContent !== 'undefined' && rawExportContent) {
        var format = currentExportFormat || 'css';
        var syntaxValidation = null;

        if (format === 'css' || format === 'scss' || format === 'semantic') {
          syntaxValidation = validateCSSSyntax(rawExportContent);
          tests.push({
            name: "Validation syntaxe CSS",
            passed: syntaxValidation.valid,
            detail: syntaxValidation.valid ? "OK" : "Erreurs: " + syntaxValidation.errors.join(", ")
          });
        } else if (format === 'json') {
          syntaxValidation = validateJSONSyntax(rawExportContent);
          tests.push({
            name: "Validation syntaxe JSON",
            passed: syntaxValidation.valid,
            detail: syntaxValidation.valid ? "OK" : "Erreurs: " + syntaxValidation.errors.join(", ")
          });
        } else if (format === 'tailwind') {
          syntaxValidation = validateJSSyntax(rawExportContent);
          tests.push({
            name: "Validation syntaxe JavaScript",
            passed: syntaxValidation.valid,
            detail: syntaxValidation.valid ? "OK" : "Erreurs: " + syntaxValidation.errors.join(", ")
          });
        }

        if (syntaxValidation && !syntaxValidation.valid) {
          allPassed = false;
        }
      }

      // Rapport des tests
      tests.forEach(function (test) {
        if (test.passed) {
          console.log("✅", test.name);
        } else {
          console.error("❌", test.name + ":", test.detail);
          allPassed = false;
        }
      });

      if (!allPassed) {
        console.warn("⚠️ Certains tests d'intégrité ont échoué. L'export peut produire des résultats inattendus.");
      } else {
        console.log("🎯 Tous les tests d'intégrité passent. Export prêt.");
      }
    }

    function updateExport() {
      if (!currentTokens) return;

      // 1. Normalisation pure pour l'export uniquement (fonction pure)
      var exportTokens = normalizeTokensForExport(currentTokens);

      // 2. TESTS RUNTIME - Validation de l'intégrité des exports
      runExportIntegrityTests(exportTokens);

      var format = currentExportFormat;
      var output = "";

      try {
        // Phase 1: Normalisation - créer les ExportEntries
        var exportOptions = {
          preferAliasVar: true, // Utiliser var(--...) pour les alias sémantiques
          includePrimitives: format !== "semantic", // Tous sauf semantic only
          includeSemantic: true, // Toujours inclure semantic
          semanticPrefix: "semantic-",
          primitivePrefix: ""
        };

        var exportEntries = buildExportEntries(exportTokens, exportOptions);

        // Mini test runtime interne
        assertExportHasPrimitivesWhenAvailable(exportTokens, exportEntries);

        // Phase 1.5: Normalisation des valeurs (unités CSS et préservation des alias)
        exportEntries.forEach(e => e.value = normalizeExportEntryValue(e));

        // Vérifier si structure plate demandée
        var useFlatStructure = exportFlatStructure ? exportFlatStructure.checked : false;

        // Phase 2: Formatage selon le type demandé
        if (format === "css") {
          output = useFlatStructure ? formatCSSFlat(exportEntries) : formatCSS(exportEntries);
        } else if (format === "json") {
          output = useFlatStructure ? formatJSONFlat(exportEntries, { pretty: true }) : formatJSON(exportEntries, { pretty: true });
        } else if (format === "tailwind") {
          output = formatTailwindConfig(exportEntries);
        } else if (format === "scss") {
          output = useFlatStructure ? formatSCSSFlat(exportEntries) : formatSCSS(exportEntries);
        } else if (format === "semantic") {
          // Semantic only - filtrer les semantic dans formatCSS
          var semanticEntries = exportEntries.filter(e => e.group === "semantic");
          output = useFlatStructure ? formatCSSFlat(semanticEntries) : formatCSS(semanticEntries);
        }

        rawExportContent = output;

        // Générer les types TypeScript si format JSON
        if (format === "json") {
          var tsDefinitions = generateTypeScriptDefinitions(exportEntries);
          // Stocker les définitions TypeScript pour téléchargement optionnel
          window.exportTypeScriptDefinitions = tsDefinitions;
        }

        // Determine syntax lang
        var lang = 'css'; // default
        if (format === 'json') lang = 'json';
        if (format === 'tailwind') lang = 'js';
        if (format === 'scss') lang = 'scss';
        if (format === 'semantic') lang = 'css';

        codeEditor.innerHTML = highlightSyntax(output, lang);

      } catch (error) {
        console.error("❌ Erreur lors de l'export:", error);
        output = "/* Erreur lors de l'export: " + error.message + " */";
        rawExportContent = output;
        codeEditor.innerHTML = highlightSyntax(output, 'css');
      }
    }

    // Gestion des onglets de format d'export
    if (exportFormatTabs) {
      var formatTabs = exportFormatTabs.querySelectorAll('.tab');
      formatTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          // Retirer la classe active de tous les onglets
          formatTabs.forEach(function (t) { t.classList.remove('active'); });
          // Ajouter la classe active à l'onglet cliqué
          tab.classList.add('active');
          // Mettre à jour le format actuel
          currentExportFormat = tab.getAttribute('data-format');
          // Mettre à jour l'export
          updateExport();
        });
      });
    }

    // Mettre à jour l'export quand la structure plate est modifiée
    if (exportFlatStructure) {
      exportFlatStructure.addEventListener("change", updateExport);
    }

    function copyCheck(btn) {
      var originalHTML = btn.innerHTML;
      // Simple visual feedback
      btn.classList.add("copied"); // Optional: add a class for CSS styling
      // Try to find text node or just set innerHTML
      var textSpan = btn.querySelector("span:not(.icon)"); // Try to find text part

      btn.innerHTML = '<span class="icon">✓</span> Copied!';

      setTimeout(function () {
        btn.innerHTML = originalHTML;
        btn.classList.remove("copied");
      }, 2000);
    }

    function doCopy(btnTrigger) {
      if (!rawExportContent) return;

      var ta = document.createElement("textarea");
      ta.value = rawExportContent;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);

      copyCheck(btnTrigger);
    }

    copyBtnFooter.addEventListener("click", function () { doCopy(copyBtnFooter); });

    // Bouton retour à l'accueil pour nouvelle génération
    backToHomeBtn.addEventListener("click", function () {
      switchStep(0);
    });

    // ============================================
    // TOKEN EDITING FUNCTIONS
    // ============================================
    var editingTokenKey = null;

    function quickAddToken() {
      if (!currentTokens || !currentTokens[activeCategory]) return;

      var keyInput = document.getElementById('newTokenKey');
      var valueInput = document.getElementById('newTokenValue');

      if (!keyInput || !valueInput) return;

      var name = keyInput.value.trim();
      var value = valueInput.value.trim();

      if (!name || !value) {
        alert("Nom et valeur requis");
        return;
      }

      if (currentTokens[activeCategory][name]) {
        if (!confirm('Le token "' + name + '" existe déjà. Écraser ?')) return;
      }

      currentTokens[activeCategory][name] = value;
      updatePreview();
      updateExport();

      // Auto-focus pour enchainer
      setTimeout(function () {
        var nextInput = document.getElementById('newTokenKey');
        if (nextInput) nextInput.focus();
      }, 50);
    }

    function deleteToken(tokenKey) {
      if (!currentTokens || !currentTokens[activeCategory]) return;

      if (confirm('Are you sure you want to delete "' + tokenKey + '"?')) {
        delete currentTokens[activeCategory][tokenKey];
        updatePreview();
        updateExport();
      }
    }

    function addToken() {
      if (!currentTokens) return;

      editingTokenKey = null;
      document.getElementById('modalTitle').textContent = 'Add Token';
      document.getElementById('modalTokenName').value = '';
      document.getElementById('modalTokenName').disabled = false;
      document.getElementById('modalTokenValue').value = '';
      document.getElementById('tokenModal').classList.add('active');
    }

    function saveToken() {
      var tokenName = document.getElementById('modalTokenName').value.trim();
      var tokenValue = document.getElementById('modalTokenValue').value.trim();

      if (!tokenName || !tokenValue) {
        alert('Please fill in both name and value');
        return;
      }

      if (!currentTokens[activeCategory]) {
        currentTokens[activeCategory] = {};
      }

      // If adding new token and name already exists
      if (!editingTokenKey && currentTokens[activeCategory][tokenName]) {
        if (!confirm('Token "' + tokenName + '" already exists. Overwrite?')) {
          return;
        }
      }

      currentTokens[activeCategory][tokenName] = tokenValue;
      closeModal();
      updatePreview();
      updateExport();
    }

    function closeModal() {
      document.getElementById('tokenModal').classList.remove('active');
      editingTokenKey = null;
    }

    // Close modal on background click
    document.getElementById('tokenModal').addEventListener('click', function (e) {
      if (e.target.id === 'tokenModal') {
        closeModal();
      }
    });

    // ============================================
    // CSS PARSER
    // ============================================
    function parseCssToTokens(css) {
      var tokens = {
        brand: {},
        system: {},
        gray: {},
        spacing: {},
        radius: {},
        typography: {},
        border: {}
      };

      // Regex to match --variable: value;
      var regex = /--([a-zA-Z0-9-_]+):\s*([^;]+);/g;
      var match;

      while ((match = regex.exec(css)) !== null) {
        var key = match[1].trim();
        var value = match[2].trim();

        // Categorization Logic
        if (key.includes("brand") || key.includes("primary")) {
          tokens.brand[key] = value;
        } else if (key.includes("system") || key.includes("success") || key.includes("warning") || key.includes("error") || key.includes("info")) {
          tokens.system[key] = value;
        } else if (key.includes("gray") || key.includes("grey") || key.includes("neutral")) {
          tokens.gray[key] = value;
        } else if (key.includes("spacing") || key.includes("gap") || key.includes("margin") || key.includes("padding")) {
          tokens.spacing[key] = value;
        } else if (key.includes("radius") || key.includes("rounded")) {
          tokens.radius[key] = value;
        } else if (key.includes("typo") || key.includes("font") || key.includes("text")) {
          tokens.typography[key] = value;
        } else if (key.includes("border") || key.includes("stroke")) {
          tokens.border[key] = value;
        }
      }

      return tokens;
    }



    // ============================================
    // INITIALIZATION
    // ============================================
    updateColorPreview(currentColor);
    // INITIALIZATION
    colorInput.value = currentColor;
    colorPicker.value = currentColor;
    updateColorPreview(currentColor);


    // ============================================
    // WINDOW RESIZE FUNCTIONALITY
    // ============================================

    // Resize handle element
    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'resize-handle';
    resizeHandle.innerHTML = '↗';
    resizeHandle.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: nw-resize;
      background: var(--poly-surface);
      color: var(--poly-text-muted);
      border: 1px solid var(--poly-border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: normal;
      border-radius: 3px 0 0 0;
      user-select: none;
      z-index: 1000;
      opacity: 0.7;
      transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;

    resizeHandle.addEventListener('mouseenter', function () {
      this.style.backgroundColor = 'var(--poly-accent)';
      this.style.color = 'var(--poly-bg)';
      this.style.opacity = '1';
      this.style.transform = 'scale(1.1)';
    });

    resizeHandle.addEventListener('mouseleave', function () {
      this.style.backgroundColor = 'var(--poly-surface)';
      this.style.color = 'var(--poly-text-muted)';
      this.style.opacity = '0.7';
      this.style.transform = 'scale(1)';
    });

    document.body.appendChild(resizeHandle);

    // Resize functionality
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    function startResize(e) {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;

      // Get current window size
      startWidth = window.innerWidth;
      startHeight = window.innerHeight;

      document.body.classList.add('resizing');
      document.body.style.cursor = 'nw-resize';

      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      e.preventDefault();
    }

    function resize(e) {
      if (!isResizing) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // Contraintes de taille pour une bonne UX
      const MIN_WIDTH = 400;
      const MAX_WIDTH = 1600;
      const MIN_HEIGHT = 500;
      const MAX_HEIGHT = 1400;

      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + deltaX));
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight + deltaY));

      // Send resize message to main thread
      parent.postMessage({
        pluginMessage: {
          type: 'resize',
          width: newWidth,
          height: newHeight
        }
      }, '*');
    }

    function stopResize() {
      isResizing = false;
      document.body.classList.remove('resizing');
      document.body.style.cursor = '';

      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    }

    resizeHandle.addEventListener('mousedown', startResize);

    // Prevent text selection during resize
    resizeHandle.addEventListener('selectstart', function (e) {
      e.preventDefault();
    });

    // ============================================
    // CUSTOM DROPDOWN - Gestion JS
    // ============================================

    // Toggle dropdown (ouvrir/fermer)
    function toggleCustomDropdown(container) {
      var isOpen = container.classList.contains('open');

      // Fermer tous les autres dropdowns
      document.querySelectorAll('.custom-select-container.open').forEach(function (other) {
        if (other !== container) {
          other.classList.remove('open');
        }
      });

      // Toggle le dropdown actuel
      if (isOpen) {
        container.classList.remove('open');
      } else {
        container.classList.add('open');
      }
    }

    // Event delegation pour les options
    document.addEventListener('click', function (e) {
      var optionItem = e.target.closest('.option-item');
      if (optionItem) {
        e.stopPropagation();

        var container = optionItem.closest('.custom-select-container');
        if (!container) return;

        // Récupérer les données depuis les data-attributes
        var variableId = optionItem.getAttribute('data-variable-id');
        var variableName = optionItem.getAttribute('data-variable-name');
        var variableValue = optionItem.getAttribute('data-variable-value');
        var indicesStr = container.getAttribute('data-indices');
        var indices = JSON.parse(indicesStr);

        // Mettre à jour le trigger
        var trigger = container.querySelector('.select-trigger');
        var colorDot = trigger.querySelector('.color-dot');
        var selectedLabel = trigger.querySelector('.selected-label');

        // Mettre à jour le label
        selectedLabel.textContent = variableName;

        // Mettre à jour la couleur si c'est une couleur
        if (variableValue && variableValue.indexOf('#') === 0) {
          colorDot.style.background = variableValue;
        }

        // Marquer l'option comme sélectionnée
        container.querySelectorAll('.option-item').forEach(function (item) {
          item.classList.remove('selected');
        });
        optionItem.classList.add('selected');

        // Fermer le dropdown
        container.classList.remove('open');

        // Appeler la fonction d'application
        applyGroupFix(indices, variableId);
      }
    });

    // Click outside pour fermer les dropdowns
    // Click outside pour fermer les dropdowns
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.custom-select-container')) {
        document.querySelectorAll('.custom-select-container.open').forEach(function (container) {
          container.classList.remove('open');
        });
      }
    });

    // ui.html - Gestion Accessible du Dropdown
    document.addEventListener('keydown', function (e) {
      // Ignorer si le focus est sur un input/textarea classique
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      var container = document.activeElement.closest('.custom-select-container');

      // Si on n'est pas sur un container focusable, on cherche si on est DANS un container ouvert via l'élément actif
      if (!container) {
        // Cas où on navigue dans une liste ouverte ? Pas vraiment applicable ici car tabindex est sur le container.
        // On garde la logique simple : le focus doit être sur le container.
        return;
      }

      var isOpen = container.classList.contains('open');

      // ENTER / SPACE : Ouvrir ou Fermer
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCustomDropdown(container);
        return;
      }

      // NAVIGATION FLÈCHES (Si ouvert)
      if (isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        var options = Array.from(container.querySelectorAll('.option-item'));
        var currentIndex = options.findIndex(function (opt) { return opt.classList.contains('selected'); });
        var nextIndex = 0;

        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        }

        // Simuler le clic pour déclencher ta logique existante (mise à jour label + trigger)
        options[nextIndex].click();

        // Garder ouvert pour continuer à naviguer (car le click ferme par défaut)
        container.classList.add('open');

        // Scroll automatique vers l'option
        options[nextIndex].scrollIntoView({ block: 'nearest' });
      }

      // ESCAPE : Fermer
      if (e.key === 'Escape' && isOpen) {
        container.classList.remove('open');
        container.focus(); // Rendre le focus au parent
      }
    });

    // Inject Logo
    if (document.querySelector('.header-logo-section') && ICONS.logo) {
      document.querySelector('.header-logo-section').innerHTML = ICONS.logo;
    }

