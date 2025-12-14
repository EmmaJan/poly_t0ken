
    // ============================================
    // STATE
    // ============================================
    var currentColor = "#6366F1";
    var currentNaming = "";
    var currentTokens = null;
    var selectedFile = null;
    var activeCategory = "brand";
    var currentStep = 0;
    var lastScanResults = null; // Stockage global des résultats du dernier scan
    var livePreviewReady = false; // Indicateur simple : système prêt pour Live Preview
    var initialProblemCount = 0; // Stockage du nombre initial de problèmes pour la jauge

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
    var exportFormat = document.getElementById("exportFormat");
    // exportOutput is removed, using codeEditor and rawExportContent
    // copyBtn removed, replaced by copyBtnFooter
    var copyBtnFooter = document.getElementById("copyBtnFooter");
    var downloadBtn = document.getElementById("downloadBtn");

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
    var existingTokensInfo = document.getElementById("existingTokensInfo");
    var existingTokensCount = document.getElementById("existingTokensCount");
    var realFileInput = document.getElementById("realFileInput");
    var step0Next = document.getElementById("step0Next");

    // Mode Toggle
    var modeToggle = document.getElementById("modeToggle");

    // Vue 1 Elements
    var libraryOptions = document.querySelectorAll(".library-option");
    var step1Back = document.getElementById("step1Back");
    var step1Next = document.getElementById("step1Next");

    // Vue 2 Elements
    var step2Back = document.getElementById("step2Back");
    var step2Generate = document.getElementById("step2Generate");

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
    var currentStartOption = null; // 'new', 'import', 'manage'

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
    // VUE 0: ACCUEIL - Event Listeners
    // ============================================

    function selectStartOption(option) {
      currentStartOption = option;

      // Update UI classes
      choiceNewSystem.classList.remove("active");
      choiceImportFile.classList.remove("active");
      choiceManageTokens.classList.remove("active");
      choiceVerifyFrames.classList.remove("active");

      if (option === 'new') choiceNewSystem.classList.add("active");
      if (option === 'import') choiceImportFile.classList.add("active");
      if (option === 'manage') choiceManageTokens.classList.add("active");
      if (option === 'verify') choiceVerifyFrames.classList.add("active");

      // Enable Next Button
      step0Next.disabled = false;
    }

    choiceNewSystem.addEventListener("click", function () {
      selectStartOption('new');
    });

    choiceImportFile.addEventListener("click", function () {
      selectStartOption('import');
    });

    choiceManageTokens.addEventListener("click", function () {
      if (hasExistingTokens && existingTokensData) {
        selectStartOption('manage');
      }
    });

    choiceVerifyFrames.addEventListener("click", function () {
      selectStartOption('verify');
    });

    // Handle "Continuer" Button Click
    step0Next.addEventListener("click", function () {
      if (!currentStartOption) return;

      if (currentStartOption === 'new') {
        switchStep(1); // Go to library selection
      }
      else if (currentStartOption === 'import') {
        realFileInput.click(); // Open file picker
      }
      else if (currentStartOption === 'manage') {
        // Charger les tokens existants
        console.log("Chargement des tokens existants...");
        currentTokens = existingTokensData;
        currentNaming = existingLibrary || "tailwind";

        // Aller directement à Vue 3
        updatePreview();
        updateExport();
        switchStep(3);
      }
      else if (currentStartOption === 'verify') {
        switchStep(4); // Go to frame verification
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
              console.log("Fichier chargé en mémoire, prêt à être importé.");
            }
          } catch (err) {
            alert("Error parsing file: " + err.message);
          }
        };
        reader.readAsText(selectedFile);
      }
    });

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
        currentNaming = option.getAttribute("data-library");

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

    colorPicker.addEventListener("input", function () {
      currentColor = colorPicker.value.toUpperCase();
      colorInput.value = currentColor;
      updateColorPreview(currentColor);
    });

    colorInput.addEventListener("input", function () {
      currentColor = colorInput.value.toUpperCase();
      colorPicker.value = currentColor;
      updateColorPreview(currentColor);
    });

    randomBtn.addEventListener("click", function () {
      var randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0").toUpperCase();
      currentColor = randomColor;
      colorInput.value = randomColor;
      colorPicker.value = randomColor;
      updateColorPreview(randomColor);
    });

    step2Back.addEventListener("click", function () {
      switchStep(1); // Back to library selection
    });

    step2Generate.addEventListener("click", function () {
      // Send message to plugin to generate tokens
      parent.postMessage({
        pluginMessage: {
          type: "generate",
          color: currentColor,
          naming: currentNaming
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
            naming: currentNaming
          }
        }, "*");
      });
    }

    backToLibBtn.addEventListener("click", function () {
      // Reset library selection
      libraryOptions.forEach(function (opt) {
        opt.classList.remove("selected");
      });
      currentNaming = "";
      step1Next.disabled = true;
      switchStep(1); // Back to library selection
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
      var scanLoadingState = document.getElementById("scanLoadingState");

      if (scanResults) scanResults.classList.add('hidden');
      if (scanEmptyState) scanEmptyState.classList.remove('hidden'); // Afficher l'état vide par défaut
      if (scanLoadingState) scanLoadingState.classList.add('hidden');

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
          if (property === 'Fill' || property === 'Stroke') {
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

        // Créer une clé unique basée sur propriété + valeur
        var groupKey = result.property + '-' + result.value;

        if (!groups[groupKey]) {
          var suggestions = result.colorSuggestions || result.numericSuggestions || [{ id: result.suggestedVariableId, name: result.suggestedVariableName, isExact: true }];
          groups[groupKey] = {
            property: result.property,
            value: result.value,
            originalIndices: [],
            suggestions: enrichSuggestionsWithValues(suggestions, result.property, result.value),
            layerNames: [] // Pour debug si nécessaire
          };
        }

        groups[groupKey].originalIndices.push(index);
        groups[groupKey].layerNames.push(result.layerName);

        // Fusionner les suggestions si elles diffèrent
        var suggestionsToMerge = result.colorSuggestions || result.numericSuggestions;
        if (suggestionsToMerge) {
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

    function renderCompactRow(group) {
      var hasConflicts = group.suggestions.length > 1;
      var bestSuggestion = group.suggestions[0];

      // Fonction helper pour obtenir l'icône SVG selon le type de propriété
      function getPropertyIcon(property) {
        switch (property) {
          case 'Fill':
            return '<span class="property-label">Fond</span>';
          case 'Stroke':
            return '<span class="property-label">Contour</span>';
          case 'Radius':
            return '<span class="property-label">Rayon</span>';
          case 'Spacing':
          case 'Width':
          case 'Height':
            return '<span class="property-label">Espacement</span>';
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
      if (group.property === "Fill" || group.property === "Stroke") {
        html += '<div class="mini-swatch" style="background-color: ' + group.value + ';"></div>';
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
      if (hasConflicts) {
        // Multiple suggestions - select avec bordure orange
        html += '<select class="conflict-select" onchange="applyGroupFix([' + group.originalIndices.join(',') + '], this.value)">';
        html += '<option value="">⚠️ Choisir parmi ' + group.suggestions.length + ' variables</option>';
        group.suggestions.forEach(function (suggestion, idx) {
          var distanceIndicator = suggestion.isExact ? '' : ' ≈';
          var valuePreview = suggestion.hex ? suggestion.hex : (suggestion.value !== undefined ? suggestion.value : "");
          html += '<option value="' + suggestion.id + '">' + suggestion.name + ' (' + valuePreview + ')' + distanceIndicator + '</option>';
        });
        html += '</select>';
      } else {
        // Single suggestion - bouton pill vert
        html += '<button class="variable-pill" data-variable-name="' + bestSuggestion.name + '" onclick="applyGroupFix([' + group.originalIndices.join(',') + '], \'' + bestSuggestion.id + '\')">';
        html += '<svg class="variable-icon" viewBox="0 0 16 16"><path fill="currentColor" d="M8 2l2.5 5 5.5.5-4 4 .5 5.5L8 12l-4 2 .5-5.5-4-4 5.5-.5L8 2z"/></svg>';
        html += '<span>' + bestSuggestion.name + '</span>';
        html += '</button>';
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
      // Activer le verrou pour 2 secondes
      window.ignoreSelectionChangeUntil = Date.now() + 2000;
      console.log('[UI] Verrouillage Auto-Scan activé pour 2s');

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

    // ============================================
    // ✅ CORRECTIF GLOBAL : SCROLL, FILTRES & ACTIONS
    // ============================================

    function displayScanResults(results) {
      console.log('[displayScanResults] Démarrage affichage de', results ? results.length : 0, 'résultats');
      console.log('[displayScanResults] Résultats bruts:', results);

      try {
        // 1. ARRÊT IMPÉRATIF DU LOADING (Sécurité maximale)
        hideScanLoading();

        var loadingState = document.getElementById('scanLoadingState');
        if (loadingState) {
          loadingState.classList.add('hidden');
          loadingState.style.display = 'none';
        }

        // 2. Gestion et vérification des données
        var emptyState = document.getElementById('scanEmptyState');
        var resultsDiv = document.getElementById('scanResults');

        if (!results || results.length === 0) {
          if (emptyState) {
            emptyState.classList.remove("hidden");
            emptyState.style.display = 'block';
          }
          if (resultsDiv) {
            resultsDiv.classList.add("hidden");
            resultsDiv.style.display = 'none';
          }
          return;
        }

        // On a des résultats
        if (emptyState) {
          emptyState.classList.add("hidden");
          emptyState.style.display = 'none';
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

        // 4. Calcul des Stats manuel (plus fiable car basé sur les groupes réels)
        var stats = { autoFixable: 0, manualFixes: 0 };
        groups.forEach(function (g) {
          if (g.suggestions && g.suggestions.length === 1) {
            stats.autoFixable += (g.originalIndices ? g.originalIndices.length : 1);
          } else {
            stats.manualFixes += (g.originalIndices ? g.originalIndices.length : 1);
          }
        });

        // 5. Stockage Global
        lastScanResults = results;
        livePreviewReady = true;
        initialProblemCount = results.length;

        // Mise à jour UI
        updateFilterCounts(stats);

        // 6. Génération HTML (avec tolérance aux pannes)
        var unifiedHtml = generateUnifiedCleaningContent(groups, stats);

        var listContainer = document.getElementById('unifiedCleaningList');
        if (listContainer) {
          listContainer.innerHTML = unifiedHtml;
        }

        // 7. Initialisation Jauge & Events
        if (typeof updateProgressGauge === 'function') updateProgressGauge(results.length);
        if (typeof attachCardEventHandlers === 'function') attachCardEventHandlers();
        if (typeof enableVariableSelectors === 'function') enableVariableSelectors();

        // 8. Application du Filtre par défaut
        if (!currentFilter) currentFilter = 'auto';
        if (typeof applyFilter === 'function') applyFilter(currentFilter);

        // 9. AFFICHAGE FINAL
        if (resultsDiv) {
          resultsDiv.classList.remove("hidden");
          resultsDiv.style.display = "flex";
        }

        // 10. Mise à jour Footer
        if (typeof updateProblemCounter === 'function') updateProblemCounter(results.length, true);

      } catch (error) {
        console.error("🔥 CRASH DISPLAY:", error);
        var ls = document.getElementById('scanLoadingState');
        var rd = document.getElementById('scanResults');
        if (ls) ls.style.display = 'none';
        if (rd) rd.style.display = 'flex'; // Tenter d'afficher quand même
      }
    }

    // Fonction pour activer les sélecteurs de variables après un scan
    function enableVariableSelectors() {
      console.log('[UI] Activation des sélecteurs de variables après scan - lastScanResults:', lastScanResults ? lastScanResults.length + ' éléments' : 'NON DEFINI');

      var selectors = document.querySelectorAll('.variable-selector');
      console.log('[UI] Nombre de sélecteurs trouvés:', selectors.length);

      selectors.forEach(function (selector, index) {
        console.log('[UI] Activation sélecteur', index + 1, '- état avant:', selector.disabled);
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

        console.log('[UI] Activation sélecteur', index + 1, '- état après:', selector.disabled);

        // Remettre l'option par défaut appropriée
        var defaultOption = selector.querySelector('option[value=""]');
        if (defaultOption) {
          defaultOption.textContent = 'Choisir une variable...';
          console.log('[UI] Option par défaut mise à jour pour sélecteur', index + 1);
        }
      });

      console.log('[UI] Activation terminée');
    }


    // ============================================
    // NOUVELLES FONCTIONS POUR LE SYSTÈME UNIFIÉ
    // ============================================

    // Mettre à jour les compteurs de filtres
    // Mettre à jour les compteurs de filtres (100% Défensif)
    function updateFilterCounts(stats) {
      if (!stats) return;

      var autoCount = document.getElementById('autoCount');
      if (autoCount) autoCount.textContent = stats.autoFixable || 0;

      var manualCount = document.getElementById('manualCount');
      if (manualCount) manualCount.textContent = stats.manualFixes || 0;

      var magicCount = document.getElementById('autoCountMagic');
      if (magicCount) magicCount.textContent = stats.autoFixable || 'X';
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

      var html = '';

      groups.forEach(function (group, index) {
        try {
          var hasConflicts = group.suggestions && group.suggestions.length > 1;
          var bestSuggestion = group.suggestions && group.suggestions.length > 0 ? group.suggestions[0] : null;
          var layerCount = group.originalIndices ? group.originalIndices.length : 0;
          var isAutoFixable = group.suggestions && group.suggestions.length === 1;
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
          html += '<div class="' + cardClass + '" data-indices="' + indicesJson + '" style="display: flex; flex-direction: column; padding: 12px 16px; margin-bottom: 8px; background: var(--poly-surface); border: 1px solid var(--poly-border-subtle); border-radius: 12px;">';

          // HEADER (Propriété + Actions)
          html += '<div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">';

          // GAUCHE: Icône + Nom Propriété
          html += '<div style="display: flex; align-items: center; gap: 6px;">';
          html += '<span style="color: var(--poly-accent);">' + getPropertyIcon(group.property) + '</span>';
          html += '</div>';

          // DROITE: Actions (Voir, Appliquer, Ignorer)
          html += '<div style="display: flex; gap: 6px;">';

          // Bouton Voir
          html += '<button class="btn-outline btn-view" data-action="view" data-indices="' + indicesJson + '" title="Voir dans Figma" style="width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
            '</button>';

          // Bouton Appliquer
          var applyDisabled = (isOrphan || hasConflicts) ? 'disabled' : '';
          var applyClass = isOrphan ? 'btn-outline' : 'btn-primary';
          html += '<button class="' + applyClass + ' btn-apply-action" data-action="apply" data-indices="' + indicesJson + '" ' + applyDisabled + ' title="Appliquer" style="width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg>' +
            '</button>';

          // Bouton Ignorer
          html += '<button class="btn-x" data-action="ignore" data-indices="' + indicesJson + '" title="Ignorer" style="width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>';

          html += '</div>'; // Fin Actions
          html += '</div>'; // Fin Header

          // BODY (Comparaison Valeurs)
          html += '<div class="card-body" style="display: flex; align-items: center; gap: 12px;">';

          // 1. Valeur Actuelle
          html += '<div style="flex: 1; min-width: 0;">';
          var displayValue = group.value;
          if (typeof displayValue === 'object') displayValue = 'Mixte';

          html += '<div style="display: flex; align-items: center; gap: 8px;">';
          if ((group.property === 'Fill' || group.property === 'Stroke') && typeof displayValue === 'string' && displayValue.startsWith('#')) {
            html += '<div style="width: 20px; height: 20px; border-radius: 4px; background-color: ' + displayValue + '; border: 1px solid var(--poly-border-subtle);"></div>';
            html += '<div style="display: flex; flex-direction: column;"><span style="font-family: monospace; font-size: 11px; color: var(--poly-text);">' + displayValue + '</span><span style="font-size: 10px; color: var(--poly-text-muted);">' + layerCount + ' calque(s)</span></div>';
          } else {
            html += '<div style="display: flex; flex-direction: column; overflow: hidden;"><span style="font-family: monospace; font-size: 11px; color: var(--poly-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + displayValue + '</span><span style="font-size: 10px; color: var(--poly-text-muted);">' + layerCount + ' calque(s)</span></div>';
          }
          html += '</div>'; // Fin Valeur Actuelle wrapper
          html += '</div>'; // Fin Valeur Actuelle Container

          // Flèche
          html += '<div style="color: var(--poly-text-muted); flex-shrink: 0;">⟶</div>';

          // 2. Nouvelle Valeur (Fix)
          html += '<div style="flex: 1.2; min-width: 0;">';

          if (isOrphan) {
            html += '<span style="color: var(--poly-warning); font-size: 11px; font-style: italic;">Aucune variable compatible</span>';
          } else if (hasConflicts) {
            // CUSTOM DROPDOWN AVEC LIVE PREVIEW
            html += '<div class="custom-select-container variable-selector-container" data-indices="' + indicesJson + '" style="width: 100%;">';
            html += '<div class="select-trigger" style="padding: 6px 8px; min-height: 32px;">';
            html += '<span class="selected-label" style="font-size: 11px;">Choisir une variable...</span>';
            html += '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"></polyline></svg>';
            html += '</div>';
            html += '<div class="select-options" style="max-height: 200px;">';
            html += '<div class="option-item" data-variable-id="" style="font-size: 11px; padding: 8px 12px;">Choisir...</div>';
            group.suggestions.forEach(function (s) {
              var valDisplay = s.hex || s.value || '';
              var isColor = valDisplay && valDisplay.startsWith('#');
              html += '<div class="option-item" data-variable-id="' + s.id + '" data-variable-name="' + s.name + '" data-variable-value="' + valDisplay + '" style="font-size: 11px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">';
              if (isColor) {
                html += '<div style="width: 12px; height: 12px; border-radius: 2px; background-color: ' + valDisplay + '; border: 1px solid var(--poly-border-subtle); flex-shrink: 0;"></div>';
              }
              html += '<span>' + s.name + (valDisplay ? ' (' + valDisplay + ')' : '') + '</span>';
              html += '</div>';
            });
            html += '</div>';
            html += '</div>';
          } else if (isAutoFixable && bestSuggestion) {
            // Auto-fixable display
            html += '<div style="display: flex; align-items: center; gap: 6px; padding: 6px; background: rgba(138, 213, 63, 0.1); border-radius: 6px; border: 1px solid rgba(138, 213, 63, 0.3);">';
            if (bestSuggestion.resolvedValue && bestSuggestion.resolvedValue.startsWith('#')) {
              html += '<div style="width: 14px; height: 14px; border-radius: 3px; background-color: ' + bestSuggestion.resolvedValue + ';"></div>';
            }
            html += '<span style="font-size: 11px; color: var(--poly-text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + bestSuggestion.name + '</span>';
            html += '</div>';
          }
          html += '</div>'; // Fin Nouvelle Valeur

          html += '</div>'; // Fin Body
          html += '</div>'; // Fin Carte

        } catch (cardError) {
          console.error("Skipping bad card:", cardError);
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

      // 2. Actions groupées
      attachGroupedActionHandlers();

      // 3. Dropdowns
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
      console.log('[handleGroupedItemSelection] 🎯 Changement de sélection pour carte:', card.textContent, '->', isSelected);

      var dataIndices = card.getAttribute('data-indices');
      console.log('[handleGroupedItemSelection] 📋 data-indices:', dataIndices);

      if (isSelected) {
        console.log('[handleGroupedItemSelection] ✅ Sélection de la carte');
        card.classList.add('selected');

        if (dataIndices) {
          try {
            var indicesToAdd = JSON.parse(dataIndices);
            console.log('[handleGroupedItemSelection] 📊 Indices à ajouter:', indicesToAdd);
            selectedIndices = selectedIndices.concat(indicesToAdd);
            console.log('[handleGroupedItemSelection] 📊 selectedIndices après ajout:', selectedIndices);
          } catch (parseError) {
            console.error('[handleGroupedItemSelection] ❌ Erreur parsing data-indices:', parseError);
          }
        } else {
          console.warn('[handleGroupedItemSelection] ⚠️ Attribut data-indices manquant sur la carte');
        }
      } else {
        console.log('[handleGroupedItemSelection] ❌ Désélection de la carte');
        card.classList.remove('selected');

        if (dataIndices) {
          try {
            var cardIndices = JSON.parse(dataIndices);
            console.log('[handleGroupedItemSelection] 📊 Indices à retirer:', cardIndices);
            var beforeLength = selectedIndices.length;
            selectedIndices = selectedIndices.filter(function (idx) {
              return cardIndices.indexOf(idx) === -1;
            });
            console.log('[handleGroupedItemSelection] 📊 selectedIndices après retrait:', selectedIndices, '(retiré:', beforeLength - selectedIndices.length, ')');
          } catch (parseError) {
            console.error('[handleGroupedItemSelection] ❌ Erreur parsing data-indices:', parseError);
          }
        }
      }

      console.log('[handleGroupedItemSelection] 🔄 Appel de updateBulkActionsVisibility');
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

      // Boutons Ignorer groupés
      var ignoreButtons = document.querySelectorAll('button[data-action="ignore"]');
      ignoreButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var indices = JSON.parse(this.getAttribute('data-indices'));
          ignoreGroupedItems(indices);
        });
      });

      // Boutons Voir groupés (sélectionner les calques dans Figma)
      var viewButtons = document.querySelectorAll('button[data-action="view"]');
      viewButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var indices = JSON.parse(this.getAttribute('data-indices'));
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
      console.log('[applyGroupedFix] Application groupée pour indices:', indices, 'avec variable:', variableId);

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
          console.log('[DEBUG applyGroupedFix] Résultat trouvé pour index', index, ':', result);
          console.log('[DEBUG applyGroupedFix] ID suggéré vs ID demandé:', result.suggestedVariableId, 'vs', variableId);

          // Envoyer un message au plugin principal pour appliquer la correction
          console.log('[DEBUG applyGroupedFix] Envoi du message apply-single-fix pour index', index);
          parent.postMessage({
            pluginMessage: {
              type: "apply-single-fix",
              index: index,
              selectedVariableId: variableId
            }
          }, "*");
        } else {
          console.log('[DEBUG applyGroupedFix] ERREUR: Pas de résultat pour index', index);
        }
      });
    }

    function ignoreGroupedItems(indices) {
      console.log('[ignoreGroupedItems] Ignorer les éléments:', indices);

      // Trouver la card et animer avant suppression
      var card = document.querySelector('.cleaning-result-card[data-indices*="' + indices[0] + '"]');
      if (card) {
        // Animation de rejet
        card.style.transition = 'all 0.3s ease';
        card.style.backgroundColor = 'var(--poly-error-light)';
        card.style.borderColor = 'var(--poly-error)';

        // Désactiver temporairement les contrôles
        var checkbox = card.querySelector('.item-checkbox');
        var buttons = card.querySelectorAll('button[data-action]');
        if (checkbox) checkbox.disabled = true;
        buttons.forEach(function (btn) { btn.disabled = true; });

        // Animation de disparition
        setTimeout(function () {
          card.style.opacity = '0';
          card.style.transform = 'translateX(-20px)';
          setTimeout(function () {
            // Supprimer la card du DOM
            if (card.parentNode) {
              card.parentNode.removeChild(card);
            }
            // Mettre à jour les compteurs
            updateProblemCounter(-indices.length, false);
          }, 300);
        }, 1000);
      } else {
        // Fallback si la card n'est pas trouvée
        indices.forEach(function (index) {
          var card = document.querySelector('.cleaning-result-card[data-indices*="' + index + '"]');
          if (card && card.parentNode) {
            card.parentNode.removeChild(card);
          }
        });
        // Mettre à jour les compteurs
        updateProblemCounter(-indices.length, false);
      }

      // Feedback utilisateur
      showNotification(indices.length + ' élément' + (indices.length > 1 ? 's' : '') + ' ignoré' + (indices.length > 1 ? 's' : ''), 'info');
    }

    function updateBulkActionsVisibility() {
      console.log('[updateBulkActionsVisibility] 🔄 Mise à jour visibilité bouton');
      console.log('[updateBulkActionsVisibility] 📊 selectedIndices.length:', selectedIndices.length);
      console.log('[updateBulkActionsVisibility] 📋 selectedIndices:', selectedIndices);

      var bulkContainer = document.getElementById('bulkActionsContainer');
      var bulkBtn = document.getElementById('bulkFixBtn');

      console.log('[updateBulkActionsVisibility] 🔍 bulkContainer trouvé:', !!bulkContainer);
      console.log('[updateBulkActionsVisibility] 🔍 bulkBtn trouvé:', !!bulkBtn);

      if (selectedIndices.length > 0 && bulkContainer && bulkBtn) {
        console.log('[updateBulkActionsVisibility] ✅ Affichage du bouton (sélection active)');
        bulkContainer.style.display = 'block';
        bulkBtn.disabled = false;
      } else if (bulkContainer) {
        console.log('[updateBulkActionsVisibility] ❌ Masquage du bouton (pas de sélection)');
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
      console.log('[applyBulkFixes] 🚀 Démarrage application en masse pour', selectedIndices.length, 'éléments');

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

          console.log('[applyBulkFixes] 📋 Traitement index', index, ':', scanResult.layerName, '->', scanResult.property);

          try {
            // Utiliser le nouveau système avec vérification
            var verificationResult = applyAndVerifyFix(scanResult, scanResult.suggestedVariableId);

            if (verificationResult.success) {
              results.successful++;
              console.log('[applyBulkFixes] ✅ SUCCÈS pour index', index, '(' + verificationResult.details.duration + 'ms)');
            } else {
              results.failed++;
              console.log('[applyBulkFixes] ❌ ÉCHEC pour index', index, ':', verificationResult.error);
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
      console.log('[applyBulkFixes] 📊 RÉSULTATS FINAUX:');
      console.log('  - Total traité:', results.total);
      console.log('  - Réussis:', results.successful);
      console.log('  - Échoués:', results.failed);
      console.log('  - Taux de succès:', Math.round((results.successful / results.total) * 100) + '%');

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
        console.log('[applyBulkFixes] 📊 RAPPORT D\'ERREURS:');
        Object.keys(errorGroups).forEach(function (issue) {
          var group = errorGroups[issue];
          console.log('  ❌', issue + ':', group.count, 'cas');
          console.log('    📝 Exemples:', group.examples.join(', '));
          if (group.recommendations.length > 0) {
            console.log('    💡 Solutions:', group.recommendations.join(' | '));
          }
        });

        figma.notify('⚠️ ' + results.failed + ' corrections ont échoué - voir console pour diagnostic');
      }

      // Retourner les résultats détaillés pour analyse
      return results;
    }

    function updateUILocally(removedIndices) {
      console.log('[updateUILocally] Mise à jour locale de l\'UI pour indices supprimés:', removedIndices);

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
        var progressGauge = document.querySelector('.progress-gauge');
        if (progressGauge) progressGauge.style.display = 'none';

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

      // Mettre à jour le texte de statut
      var loadingText = document.querySelector('#scanLoadingState h3');
      if (loadingText) {
        loadingText.textContent = status || 'Analyse en cours...';
      }

      // Masquer la progression quand terminée
      if (progress >= 100) {
        setTimeout(function () {
          var loadingState = document.getElementById('scanLoadingState');
          if (loadingState) {
            loadingState.style.display = 'none';
          }
        }, 500);
      }
    }

    function selectNodesInFigma(indices) {
      // Activer le verrou pour éviter l'auto-scan intempestif
      window.ignoreSelectionChangeUntil = Date.now() + 2000;
      console.log('[UI selectNodesInFigma] Verrouillage Auto-Scan activé pour 2s');

      // Envoyer les indices des résultats pour sélectionner les nœuds dans Figma
      parent.postMessage({
        pluginMessage: {
          type: "highlight-nodes",
          indices: indices
        }
      }, "*");
    }

    function handleSingleFixApplied(appliedCount, error, index) {
      console.log('[DEBUG handleSingleFixApplied] Réponse reçue - appliedCount:', appliedCount, 'error:', error, 'index:', index);

      if (error) {
        console.error('[DEBUG handleSingleFixApplied] Erreur lors de l\'application:', error);
        showNotification('Erreur lors de l\'application de la correction', 'error');
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
          console.log('[DEBUG handleSingleFixApplied] Animation de la card pour index', index);
          // Animation de succès
          targetCard.style.transition = 'all 0.3s ease';
          targetCard.style.backgroundColor = 'var(--poly-success-light)';
          targetCard.style.borderColor = 'var(--poly-success)';

          // Désactiver les contrôles
          var buttons = targetCard.querySelectorAll('button[data-action]');
          buttons.forEach(function (btn) { btn.disabled = true; });

          // Marquer cette correction comme réussie
          if (!targetCard._appliedIndices) {
            targetCard._appliedIndices = [];
          }
          targetCard._appliedIndices.push(index);

          // Vérifier si toutes les corrections du groupe sont appliquées
          var cardIndices = JSON.parse(targetCard.getAttribute('data-indices') || '[]');
          var allApplied = cardIndices.every(function (idx) {
            return targetCard._appliedIndices && targetCard._appliedIndices.includes(idx);
          });

          if (allApplied) {
            // CORRECTION: Récupérer les informations depuis les data-attributes (fiable)
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

            // ✨ MORPHING BUTTON : Transformer le bouton en checkmark
            if (variablePill) {
              // Stocker le HTML original sur l'élément pour la restauration
              variablePill._originalHTML = originalButtonHTML;
              variablePill._originalStyles = originalButtonStyles;

              // Animation de morphing du bouton vers checkmark avec transition fluide
              variablePill.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              variablePill.innerHTML = '<span style="font-size: 18px; font-weight: bold;">✓</span>';
              variablePill.style.background = 'var(--poly-success)';
              variablePill.style.color = 'white';
              variablePill.style.transform = 'scale(1.08)';
              variablePill.style.boxShadow = '0 4px 12px rgba(138, 213, 63, 0.3)';
              variablePill.disabled = true;
            }

            // Stocker les données de la carte pour l'annulation
            var undoData = {
              cardElement: targetCard,
              cardIndices: cardIndices,
              oldValue: oldValue,
              newVariable: newVariable,
              originalButtonHTML: originalButtonHTML,
              originalButtonStyles: originalButtonStyles,
              originalStyles: {
                display: targetCard.style.display || 'flex',
                transform: '',
                opacity: '1',
                backgroundColor: '',
                borderColor: '',
                filter: ''
              }
            };

            // Attendre 700ms que le cerveau enregistre le succès
            setTimeout(function () {
              // Animation de glissement vers la droite
              targetCard.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              targetCard.style.transform = 'translateX(50px)';
              targetCard.style.opacity = '0';

              setTimeout(function () {
                // ✨ CACHER la carte (ne pas supprimer) pour permettre l'annulation
                targetCard.style.display = 'none';
                targetCard.style.transform = '';

                // ✨ UNDO TOAST : Afficher le toast d'annulation avec les détails
                showUndoToast(undoData);

                // Mettre à jour les compteurs
                updateProblemCounter(-cardIndices.length, false);
              }, 500);
            }, 700);
          }
        }
      } else {
        console.log('[DEBUG handleSingleFixApplied] Aucune correction appliquée pour index', index);
        showNotification('La correction n\'a pas pu être appliquée', 'warning');

        // Remettre la card à l'état normal en cas d'échec
        var cards = document.querySelectorAll('.cleaning-result-card');
        cards.forEach(function (card) {
          var cardIndices = JSON.parse(card.getAttribute('data-indices') || '[]');
          if (cardIndices.includes(index)) {
            setTimeout(function () {
              card.style.backgroundColor = '';
              card.style.borderColor = '';
              var buttons = card.querySelectorAll('button[data-action]');
              buttons.forEach(function (btn) { btn.disabled = false; });
            }, 1000);
          }
        });
      }
    }

    function handleGroupFixApplied(appliedCount, error, indices) {
      console.log('[DEBUG handleGroupFixApplied] Réponse reçue - appliedCount:', appliedCount, 'error:', error, 'indices:', indices);

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
          console.log('[DEBUG handleGroupFixApplied] Animation de la carte pour le groupe d\'indices:', indices);

          // Marquer tous les indices comme appliqués
          if (!targetCard._appliedIndices) {
            targetCard._appliedIndices = [];
          }
          indices.forEach(function (index) {
            if (!targetCard._appliedIndices.includes(index)) {
              targetCard._appliedIndices.push(index);
            }
          });

          // Animation de succès pour le groupe
          targetCard.style.transition = 'all 0.3s ease';
          targetCard.style.backgroundColor = 'var(--poly-success-light)';
          targetCard.style.borderColor = 'var(--poly-success)';

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

            // Stocker les données de la carte pour l'annulation
            var undoData = {
              cardElement: targetCard,
              cardIndices: cardIndices,
              oldValue: oldValue,
              newVariable: newVariable,
              originalButtonHTML: originalButtonHTML,
              originalButtonStyles: originalButtonStyles,
              originalStyles: {
                display: targetCard.style.display || 'flex',
                transform: '',
                opacity: '1',
                backgroundColor: '',
                borderColor: '',
                filter: ''
              }
            };

            // Attendre 700ms que le cerveau enregistre le succès
            setTimeout(function () {
              // Animation de glissement vers la droite
              targetCard.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              targetCard.style.transform = 'translateX(50px)';
              targetCard.style.opacity = '0';

              setTimeout(function () {
                // CACHER la carte (ne pas supprimer) pour permettre l'annulation
                targetCard.style.display = 'none';
                targetCard.style.transform = '';

                // UNDO TOAST : Afficher le toast d'annulation avec les détails
                showUndoToast(undoData);

                // Mettre à jour les compteurs
                updateProblemCounter(-cardIndices.length, false);
              }, 500);
            }, 700);
          }
        } else {
          console.warn('[DEBUG handleGroupFixApplied] Aucune carte trouvée pour les indices:', indices);
        }
      } else {
        console.log('[DEBUG handleGroupFixApplied] Aucune correction appliquée pour le groupe');
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
        var category = (group.property === "Fill" || group.property === "Stroke") ? "colors" : "geometry";
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
      document.getElementById('totalIssues').textContent = stats.total;
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
        if (group.property === "Fill" || group.property === "Stroke") {
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
        if (group.property === "Fill" || group.property === "Stroke") {
          html += '<div class="mini-swatch" style="background-color: ' + group.value + ';"></div>';
          html += '<span>' + group.value + '</span>';
        } else {
          html += '<span>' + group.value + '</span>';
        }
        html += '</div>';

        // Sélecteur de variable
        html += '<div class="variable-selector-row">';
        if (group.suggestions.length > 1) {
          html += '<select class="variable-selector manual-select" data-indices="' + group.originalIndices.join(',') + '" disabled style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid var(--poly-border-subtle); background: var(--poly-surface); color: var(--poly-text-muted); font-size: 12px; cursor: not-allowed;" title="Lancez d\'abord une analyse pour activer le Live Preview">';
          html += '<option value="" disabled selected>🔍 Analyse requise</option>';
          group.suggestions.forEach(function (suggestion, idx) {
            var distanceIndicator = suggestion.isExact ? '' : ' ≈';
            var valuePreview = suggestion.hex ? suggestion.hex : (suggestion.value || "");
            html += '<option value="' + suggestion.id + '">' + suggestion.name + ' (' + valuePreview + ')' + distanceIndicator + '</option>';
          });
          html += '</select>';
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
      html += '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">';

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

      // Total
      html += '<div style="text-align: center; padding: 12px; background: var(--poly-surface); border-radius: 6px;">';
      html += '<div style="font-size: 18px; font-weight: 700; color: var(--poly-accent);">' + stats.total + '</div>';
      html += '<div style="font-size: 11px; color: var(--poly-text-muted);">Total problèmes</div>';
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
      console.log('[getPropertyIcon] Propriété demandée:', '"' + property + '"');
      switch (property) {
        case 'Fill':
          return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 10 10" fill="none" style="margin-right: 3px; vertical-align: middle;"><path d="M2.5 2.5H7.5V7.5H2.5V2.5Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2 1.5H8C8.13261 1.5 8.25979 1.55268 8.35355 1.64645C8.44732 1.74021 8.5 1.86739 8.5 2V8C8.5 8.13261 8.44732 8.25979 8.35355 8.35355C8.25979 8.44732 8.13261 8.5 8 8.5H2C1.86739 8.5 1.74021 8.44732 1.64645 8.35355C1.55268 8.44732 1.5 8.13261 1.5 8V2C1.5 1.86739 1.55268 1.74021 1.64645 1.64645C1.74021 1.55268 1.86739 1.5 2 1.5ZM0.5 2C0.5 1.46957 0.710714 0.960859 1.08579 0.585786C1.46086 0.210714 1.96957 0 2.5 0H7.5C8.03043 0 8.53914 0.210714 8.91421 0.585786C9.28929 0.960859 9.5 1.46957 9.5 2V8C9.5 8.53043 9.28929 9.03914 8.91421 9.41421C8.53914 9.78929 8.03043 10 7.5 10H2.5C1.96957 10 1.46086 9.78929 1.08579 9.41421C0.710714 9.03914 0.5 8.53043 0.5 8V2ZM2.5 7.5V2.5H7.5V7.5H2.5ZM2 2.25C2 2.11193 2.11193 2 2.25 2H7.75C7.88807 2 8 2.11193 8 2.25V7.75C8 7.88807 7.88807 8 7.75 8H2.25C2.11193 8 2 7.88807 2 7.75V2.25Z" fill="currentColor"/></svg><span class="property-label">Fond</span>';
        case 'Stroke':
          return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 10 10" fill="none" style="margin-right: 3px; vertical-align: middle;"><path d="M2.5 2.5H7.5V7.5H2.5V2.5Z" fill="none" stroke="currentColor" stroke-width="0.5"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2 1.5H8C8.13261 1.5 8.25979 1.55268 8.35355 1.64645C8.44732 1.74021 8.5 1.86739 8.5 2V8C8.5 8.13261 8.44732 8.25979 8.35355 8.35355C8.25979 8.44732 8.13261 8.5 8 8.5H2C1.86739 8.5 1.74021 8.44732 1.64645 8.35355C1.55268 8.44732 1.5 8.13261 1.5 8V2C1.5 1.86739 1.55268 1.74021 1.64645 1.64645C1.74021 1.55268 1.86739 1.5 2 1.5ZM0.5 2C0.5 1.46957 0.710714 0.960859 1.08579 0.585786C1.46086 0.210714 1.96957 0 2.5 0H7.5C8.03043 0 8.53914 0.210714 8.91421 0.585786C9.28929 0.960859 9.5 1.46957 9.5 2V8C9.5 8.53043 9.28929 9.03914 8.91421 9.41421C8.53914 9.78929 8.03043 10 7.5 10H2.5C1.96957 10 1.46086 9.78929 1.08579 9.41421C0.710714 9.03914 0.5 8.53043 0.5 8V2Z" fill="none" stroke="currentColor" stroke-width="0.5"/></svg><span class="property-label">Contour</span>';
        case 'Font Size':
          return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 10 10" fill="none" style="margin-right: 3px; vertical-align: middle;"><path d="M3.5 6.5H1.2L0.6 8.5H0L2.1 0H2.8L5 8.5H4.4L3.5 6.5ZM3.1 5.5L2.4 1.8L1.7 5.5H3.1ZM6.5 4.5V4.2H6.9V8.5H6.5V8.2C6.3 8.4 6.1 8.5 5.8 8.5C5.1 8.5 4.5 7.9 4.5 7C4.5 6.1 5.1 5.5 5.8 5.5C6.1 5.5 6.3 5.6 6.5 5.8V4.5ZM5.8 7.5C6.1 7.5 6.2 7.3 6.2 7C6.2 6.7 6.1 6.5 5.8 6.5C5.5 6.5 5.4 6.7 5.4 7C5.4 7.3 5.5 7.5 5.8 7.5Z" fill="currentColor"/></svg><span class="property-label">Taille police</span>';
        case 'Radius':
        case 'Top Left Radius':
        case 'Top Right Radius':
        case 'Bottom Left Radius':
        case 'Bottom Right Radius':
          return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 10 10" fill="none" style="margin-right: 3px; vertical-align: middle;"><path d="M1 8V5C1 3.5 1 2.7 1.3 2.3C1.6 1.9 2.1 1.6 2.6 1.3C3.3 1 4.5 1 6 1H8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="property-label">Rayon</span>';
        case 'Spacing':
        case 'Item Spacing':
          return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 10 10" fill="none" style="margin-right: 3px; vertical-align: middle;"><path fill-rule="evenodd" clip-rule="evenodd" d="M1 0.5C1 0.367392 0.947321 0.240215 0.853553 0.146447C0.759785 0.0526785 0.632608 0 0.5 0C0.367392 0 0.240215 0.0526785 0.146447 0.146447C0.0526785 0.240215 0 0.367392 0 0.5V9.5C0 9.63261 0.0526785 9.75979 0.146447 9.85355C0.240215 9.94732 0.367392 10 0.5 10C0.632608 10 0.759785 9.94732 0.853553 9.85355C0.947321 9.75979 1 9.63261 1 9.5V0.5ZM9.5 0C9.63261 0 9.75979 0.0526785 9.85355 0.146447C9.94732 0.240215 10 0.367392 10 0.5V9.5C10 9.63261 9.94732 9.75979 9.85355 9.85355C9.75979 9.94732 9.63261 10 9.5 10C9.36739 10 9.24021 9.94732 9.14645 9.85355C9.05268 9.75979 9 9.63261 9 9.5V0.5C9 0.367392 9.05268 0.240215 9.14645 0.146447C9.24021 0.0526785 9.36739 0 9.5 0ZM6 6V4H4V6H6ZM7 4C7 3.73478 6.89464 3.48043 6.70711 3.29289C6.51957 3.10536 6.26522 3 6 3H4C3.73478 3 3.48043 3.10536 3.29289 3.29289C3.10536 3.48043 3 3.73478 3 4V6C3 6.26522 3.10536 6.51957 3.29289 6.70711C3.48043 6.89464 3.73478 7 4 7H6C6.26522 7 6.51957 6.89464 6.70711 6.70711C6.89464 6.51957 7 6.26522 7 6V4Z" fill="currentColor"/></svg><span class="property-label">Espacement</span>';
        case 'Padding':
          return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 10 10" fill="none" style="margin-right: 3px; vertical-align: middle;"><path fill-rule="evenodd" clip-rule="evenodd" d="M1 0.5C1 0.367392 0.947321 0.240215 0.853553 0.146447C0.759785 0.0526785 0.632608 0 0.5 0C0.367392 0 0.240215 0.0526785 0.146447 0.146447C0.0526785 0.240215 0 0.367392 0 0.5V9.5C0 9.63261 0.0526785 9.75979 0.146447 9.85355C0.240215 9.94732 0.367392 10 0.5 10C0.632608 10 0.759785 9.94732 0.853553 9.85355C0.947321 9.75979 1 9.63261 1 9.5V0.5ZM9.5 0C9.63261 0 9.75979 0.0526785 9.85355 0.146447C9.94732 0.240215 10 0.367392 10 0.5V9.5C10 9.63261 9.94732 9.75979 9.85355 9.85355C9.75979 9.94732 9.63261 10 9.5 10C9.36739 10 9.24021 9.94732 9.14645 9.85355C9.05268 9.75979 9 9.63261 9 9.5V0.5C9 0.367392 9.05268 0.240215 9.14645 0.146447C9.24021 0.0526785 9.36739 0 9.5 0ZM6 6V4H4V6H6ZM7 4C7 3.73478 6.89464 3.48043 6.70711 3.29289C6.51957 3.10536 6.26522 3 6 3H4C3.73478 3 3.48043 3.10536 3.29289 3.29289C3.10536 3.48043 3 3.73478 3 4V6C3 6.26522 3.10536 6.51957 3.29289 6.70711C3.48043 6.89464 3.73478 7 4 7H6C6.26522 7 6.51957 6.89464 6.70711 6.70711C6.89464 6.51957 7 6.26522 7 6V4Z" fill="currentColor"/></svg><span class="property-label">Padding</span>';
        default:
          return '<span class="property-label">' + property + '</span>';
      }
    }

    // ============================================
    // GESTION DES FILTRES ET SÉLECTIONS
    // ============================================

    var currentFilter = 'auto';
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
          applyFilter(currentFilter);
        });
      });
    }

    // ✅ FIX DES FILTRES (ONGLETS)
    function applyFilter(filterType) {
      currentFilter = filterType;
      var cards = document.querySelectorAll('.cleaning-result-card');
      var visibleCount = 0;

      cards.forEach(function (card) {
        // Logique simplifiée basée sur les classes CSS (plus robuste)
        var isVisible = false;

        if (filterType === 'auto') {
          isVisible = card.classList.contains('auto-fixable');
        } else if (filterType === 'manual') {
          isVisible = card.classList.contains('manual-required') || card.classList.contains('manual-fix');
        } else {
          isVisible = true; // 'all'
        }

        card.style.display = isVisible ? 'flex' : 'none';
        if (isVisible) visibleCount++;
      });

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

      updateFilterContent(filterType);
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

    // Mettre à jour le contenu selon le filtre actif
    function updateFilterContent(filterType) {
      var titleElement = document.getElementById('contentTitle');
      var descElement = document.getElementById('contentDesc');

      switch (filterType) {
        case 'auto':
          titleElement.textContent = 'Corrections automatiques';
          descElement.textContent = 'Ces valeurs correspondent exactement à vos variables et peuvent être corrigées automatiquement.';
          break;
        case 'manual':
          titleElement.textContent = 'Corrections manuelles';
          descElement.textContent = 'Ces valeurs ont plusieurs correspondances possibles. Choisissez la variable appropriée pour chaque cas.';
          break;
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
        console.log('[Scanner] Scan already in progress, skipping UI update');
        return;
      }

      isScanning = true;
      var scanEmptyState = document.getElementById('scanEmptyState');
      var scanResults = document.getElementById('scanResults');
      var unifiedList = document.getElementById('unifiedCleaningList');

      if (scanEmptyState) {
        scanEmptyState.classList.add('hidden');
        scanEmptyState.style.display = 'none';
      }

      // Afficher le conteneur de résultats
      if (scanResults) {
        scanResults.classList.remove('hidden');
        scanResults.style.display = 'flex';
      }

      // Injecter le Skeleton
      if (unifiedList) {
        var skeletonHTML = '';
        for (var i = 0; i < 4; i++) {
          skeletonHTML += '<div class="cleaning-result-card skeleton-card" style="height: 100px; padding: 16px; display: flex; flex-direction: column; gap: 12px; border: 1px solid var(--poly-border-subtle); margin-bottom: 8px;">';
          skeletonHTML += '<div style="display: flex; justify-content: space-between;"><div class="skeleton-line" style="width: 120px; height: 16px; border-radius: 4px; background: rgba(255,255,255,0.05);"></div><div class="skeleton-line" style="width: 80px; height: 24px; border-radius: 4px; background: rgba(255,255,255,0.05);"></div></div>';
          skeletonHTML += '<div style="display: flex; gap: 12px; align-items: center;"><div class="skeleton-line" style="width: 24px; height: 24px; border-radius: 4px; background: rgba(255,255,255,0.05);"></div><div class="skeleton-line" style="flex: 1; height: 12px; border-radius: 4px; background: rgba(255,255,255,0.05);"></div></div>';
          skeletonHTML += '</div>';
        }
        unifiedList.innerHTML = skeletonHTML;
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
      console.log('✅ Loading state cleared');
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
            console.log('[UI] Triggering Preview for variable:', variableId, 'on indices:', indices);
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
    }

    // Application groupée des corrections manuelles
    function applyAllManualFixes() {
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

    // ✨ UNDO TOAST : Fonctions du toast d'annulation premium
    // Variable globale pour stocker les données d'annulation en attente
    window.pendingUndoData = null;
    window.toastTimeout = null;
    window.toastDeleteTimeout = null;

    function showUndoToast(undoData) {
      var toast = document.getElementById('undoToast');
      var oldValueEl = document.getElementById('toastOldValue');
      var newVarEl = document.getElementById('toastNewVariable');

      // Stocker les données pour l'annulation
      window.pendingUndoData = undoData;

      // Mettre à jour le contenu du toast
      oldValueEl.textContent = undoData.oldValue || '--';
      newVarEl.textContent = undoData.newVariable || '--';

      // Afficher le toast
      toast.classList.add('visible');

      // Annuler les timeouts précédents
      if (window.toastTimeout) clearTimeout(window.toastTimeout);
      if (window.toastDeleteTimeout) clearTimeout(window.toastDeleteTimeout);

      // Masquer automatiquement après 4s
      window.toastTimeout = setTimeout(function () {
        hideToast();

        // Supprimer définitivement la carte après que le toast soit masqué
        window.toastDeleteTimeout = setTimeout(function () {
          if (window.pendingUndoData && window.pendingUndoData.cardElement) {
            var card = window.pendingUndoData.cardElement;
            if (card.parentNode) {
              card.parentNode.removeChild(card);
            }
            window.pendingUndoData = null;
          }
        }, 400); // Après l'animation de fermeture du toast
      }, 4000);
    }

    function hideToast() {
      var toast = document.getElementById('undoToast');
      toast.classList.remove('visible');
    }

    function triggerUndo() {
      // Annuler les timeouts
      if (window.toastTimeout) clearTimeout(window.toastTimeout);
      if (window.toastDeleteTimeout) clearTimeout(window.toastDeleteTimeout);

      // Masquer le toast immédiatement
      hideToast();

      if (!window.pendingUndoData || !window.pendingUndoData.cardElement) {
        console.warn('[triggerUndo] Aucune donnée d\'annulation disponible');
        return;
      }

      var undoData = window.pendingUndoData;
      var card = undoData.cardElement;
      var cardIndices = undoData.cardIndices;

      console.log('[triggerUndo] Annulation en cours pour indices:', cardIndices);

      // Réafficher la carte avec animation
      card.style.transition = 'none';
      card.style.transform = 'translateX(-50px)';
      card.style.opacity = '0';
      card.style.display = 'flex';

      // Forcer le reflow pour que la transition s'applique
      void card.offsetWidth;

      // Animation de réapparition
      card.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      card.style.transform = 'translateX(0)';
      card.style.opacity = '1';

      // Réinitialiser les styles de la carte
      setTimeout(function () {
        card.style.backgroundColor = '';
        card.style.borderColor = '';
        card.style.filter = '';

        // Réactiver les boutons
        var buttons = card.querySelectorAll('button[data-action]');
        buttons.forEach(function (btn) { btn.disabled = false; });

        // Réinitialiser le bouton variable pill s'il existe
        var variablePill = card.querySelector('.variable-pill');
        if (variablePill) {
          // Restaurer le HTML original si disponible
          if (undoData.originalButtonHTML) {
            variablePill.innerHTML = undoData.originalButtonHTML;
          }
          // Restaurer les styles originaux
          if (undoData.originalButtonStyles) {
            variablePill.style.background = undoData.originalButtonStyles.background || '';
            variablePill.style.color = undoData.originalButtonStyles.color || '';
            variablePill.style.transform = undoData.originalButtonStyles.transform || '';
            variablePill.style.boxShadow = undoData.originalButtonStyles.boxShadow || '';
          } else {
            variablePill.style.background = '';
            variablePill.style.color = '';
            variablePill.style.transform = '';
            variablePill.style.boxShadow = '';
          }
          variablePill.disabled = false;
        }

        // Réinitialiser les indices appliqués
        card._appliedIndices = [];
      }, 400);

      // Mettre à jour les compteurs (réajouter les éléments)
      updateProblemCounter(cardIndices.length, false);

      // Envoyer le message d'annulation à Figma
      parent.postMessage({
        pluginMessage: {
          type: 'undo-fix',
          indices: cardIndices
        }
      }, '*');

      // Nettoyer les données d'annulation
      window.pendingUndoData = null;
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

    // Appliquer toutes les corrections automatiques
    function applyAllAutoFixes() {
      var autoCards = document.querySelectorAll('.cleaning-result-card.auto-fixable');
      var fixesApplied = 0;

      autoCards.forEach(function (card) {
        var applyBtn = card.querySelector('button[onclick*="applyGroupFix"]');
        if (applyBtn) {
          // Extraire les paramètres de l'attribut onclick
          var onclickStr = applyBtn.getAttribute('onclick');
          var match = onclickStr.match(/applyGroupFix\(\[([^\]]+)\],\s*'([^']+)'\)/);
          if (match) {
            var indices = match[1].split(',').map(function (s) { return parseInt(s.trim()); });
            var variableId = match[2];
            applyGroupFix(indices, variableId);
            fixesApplied++;
          }
        }
      });

      if (fixesApplied > 0) {
        // Désactiver le bouton pendant l'application
        var applyBtn = document.getElementById('applyAllAutoBtn');
        applyBtn.disabled = true;
        applyBtn.textContent = 'Application en cours...';

        // Feedback utilisateur
        showNotification(fixesApplied + ' correction' + (fixesApplied > 1 ? 's' : '') + ' automatique' + (fixesApplied > 1 ? 's' : '') + ' appliquée' + (fixesApplied > 1 ? 's' : '') + ' !', 'success');
      }
    }

    // Exporter un rapport de nettoyage
    function exportCleaningReport() {
      var stats = {
        totalIssues: parseInt(document.getElementById('totalIssues').textContent) || 0,
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
          completion_rate: stats.totalIssues > 0 ? Math.round((stats.autoFixable / stats.totalIssues) * 100) : 100
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
      var icon = result.property === "Fill" ? ICONS.fill : ICONS.stroke;
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

      // Transformation visuelle couleur
      cardHtml += '<div style="display: flex; align-items: center; margin-right: 16px;">';
      // Rond avec la couleur brute
      cardHtml += '<div style="width: 20px; height: 20px; border-radius: 50%; background-color: ' + result.value + '; border: 1px solid var(--poly-border-subtle); margin-right: 8px;"></div>';
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
      // Gestionnaire pour les boutons d'action
      var actionButtons = document.querySelectorAll('button[data-action]');
      actionButtons.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var action = this.getAttribute('data-action');
          var index = parseInt(this.getAttribute('data-index'));

          if (action === 'apply') {
            // Récupérer la variable sélectionnée depuis le dropdown si elle existe
            var selectedVariableId = null;
            var card = this.closest('.scan-result-card');
            if (card) {
              var selector = card.querySelector('.variable-selector');
              if (selector) {
                selectedVariableId = selector.value;
              }
            }

            // Envoyer le message apply-single-fix avec la variable sélectionnée
            parent.postMessage({
              pluginMessage: {
                type: "apply-single-fix",
                index: index,
                selectedVariableId: selectedVariableId
              }
            }, "*");

            // Masquer la carte immédiatement
            if (card) {
              card.style.display = 'none';
              updateProblemCounter(-1);
            }
          } else if (action === 'ignore') {
            // Masquer la carte visuellement
            var card = this.closest('.scan-result-card');
            if (card) {
              card.style.display = 'none';
              updateProblemCounter(-1);
            }
          }
        });
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

      if (totalIssues) totalIssues.textContent = total;
      if (autoFixableEl) autoFixableEl.textContent = autoFixable;
      if (manualFixes) manualFixes.textContent = manual;

      // Mettre à jour la jauge de progression
      updateProgressGauge(total);

      // --- FIX USER REQUEST 4: Dynamic "Fix All" Button ---
      // Met à jour le bouton "Tout corriger (Auto)" avec le compte réel
      var applyAllAutoBtn = document.getElementById("applyAllAutoBtn");
      if (applyAllAutoBtn) {
        if (autoFixable > 0) {
          applyAllAutoBtn.style.display = 'flex'; // S'assurer qu'il est visible, flex pour l'alignement
          applyAllAutoBtn.disabled = false;
          applyAllAutoBtn.innerHTML = '✨ Corriger ' + autoFixable + ' éléments auto';
        } else {
          // Si 0 items auto, on cache ou désactive le bouton
          applyAllAutoBtn.style.display = 'none';
        }
      }
    }

    function updateProgressGauge(remainingProblems) {

      var progressPercentage = document.getElementById('progressPercentage');
      var progressRing = document.getElementById('progressRing');

      if (!progressPercentage || !progressRing) return;

      // Calculer le pourcentage de progression
      // On considère que le nettoyage initial a 100% de problèmes
      // Le pourcentage représente le nettoyage effectué (problèmes résolus)
      var initialTotal = initialProblemCount || 0;

      // Si on n'a pas de total initial ou qu'il n'y a plus de problèmes, considérer comme 100%
      if (initialTotal === 0) {
        var progressPercent = remainingProblems === 0 ? 100 : 0;
      } else {
        // FIX USER REQUEST 2: Logique de calcul précise
        // Formule : 100 - (currentIssues / initialIssueCount * 100)
        progressPercent = 100 - ((remainingProblems / initialTotal) * 100);
        progressPercent = Math.round(progressPercent);
        progressPercent = Math.max(0, Math.min(100, progressPercent)); // Bornes 0-100
      }

      // Mettre à jour le texte du pourcentage
      progressPercentage.textContent = progressPercent;

      // Mettre à jour l'animation du cercle
      var circumference = 219.91; // 2 * π * 35 (rayon du cercle)
      var offset = circumference - (progressPercent / 100) * circumference;
      progressRing.style.strokeDashoffset = offset + 'px'; // CORRECTION: Ajout de l'unité 'px'

      // Changer la couleur selon le progrès
      if (progressPercent === 100) {
        progressRing.style.stroke = 'var(--poly-success)';
      } else if (progressPercent > 50) {
        progressRing.style.stroke = 'var(--poly-accent)';
      } else {
        progressRing.style.stroke = 'var(--poly-warning)';
      }

      // Afficher/masquer la jauge selon qu'il y a des problèmes
      var progressGauge = document.querySelector('.progress-gauge');
      if (progressGauge) {
        var hasProblems = initialProblemCount > 0;
        progressGauge.style.display = hasProblems ? 'flex' : 'none';
      }
    }

    function applyAllFixes() {
      parent.postMessage({
        pluginMessage: {
          type: "apply-all-fixes"
        }
      }, "*");

      // Désactiver les boutons pendant l'application
      var applyAllBtn = document.getElementById("applyAllBtn");
      var step4ApplyAll = document.getElementById("step4ApplyAll");

      if (applyAllBtn) {
        applyAllBtn.disabled = true;
        applyAllBtn.textContent = "Application en cours...";
      }
      if (step4ApplyAll) {
        step4ApplyAll.disabled = true;
        step4ApplyAll.textContent = "⏳ Application...";
      }
    }

    // Scan buttons
    scanBtn.addEventListener("click", function () {
      if (isScanning) return; // Prevent re-scan if already scanning
      // NOUVEAU: Réinitialiser le compteur pour que la jauge reparte de 0
      initialProblemCount = 0;

      showScanLoading();
      parent.postMessage({
        pluginMessage: {
          type: "scan-frame"
        }
      }, "*");
    });


    // Apply all fixes button
    var applyAllBtn = document.getElementById("applyAllBtn");
    if (applyAllBtn) {
      applyAllBtn.addEventListener("click", function () {
        applyAllFixes();
      });
    }

    // Back button
    step4Back.addEventListener("click", function () {
      switchStep(0);
    });

    // Apply all button (sticky footer)
    if (step4ApplyAll) {
      step4ApplyAll.addEventListener("click", function () {
        applyAllFixes();
      });
    }

    // ============================================
    // NOUVEAUX GESTIONNAIRES POUR L'INTERFACE HIÉRARCHISÉE
    // ============================================

    // Bouton appliquer toutes les corrections automatiques
    var applyAllAutoBtn = document.getElementById("applyAllAutoBtn");
    if (applyAllAutoBtn) {
      applyAllAutoBtn.addEventListener("click", function () {
        applyAllAutoFixes();
      });
    }

    // Bouton appliquer les sélections manuelles
    var applyAllManualBtn = document.getElementById("applyAllManualBtn");
    if (applyAllManualBtn) {
      applyAllManualBtn.addEventListener("click", function () {
        applyAllManualFixes();
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
      // 🛡️ ACTIVER LE VERROU : Empêcher l'Auto-Scan de déclencher pendant le preview
      // Utilise le même mécanisme que les autres verrouillages (ignoreSelectionChangeUntil)
      window.ignoreSelectionChangeUntil = Date.now() + 2000; // 2 secondes de protection

      console.log('[sendPreviewFix] 🔒 Verrou de preview activé pour 2s');

      // 📤 ENVOYER LE MESSAGE DE PREVIEW
      console.log('[sendPreviewFix] 🔄 Envoi preview pour variable:', variableId, 'indices:', indices);
      parent.postMessage({
        pluginMessage: {
          type: 'preview-fix',
          indices: indices,
          variableId: variableId
        }
      }, '*');
    }

    // ============================================
    // MESSAGES FROM PLUGIN (ROBUST HANDLER)
    // ============================================
    window.onmessage = function (event) {
      try {
        var msg = event.data.pluginMessage;
        if (!msg) return;

        // --- GESTION SCAN-RESULTS (CRITIQUE) ---
        if (msg.type === "scan-results") {
          console.log('[UI] Scan terminé reçu. Résultats:', msg.results ? msg.results.length : 0);
          console.log('[UI] Détail des résultats:', msg.results);

          var elapsed = Date.now() - (window.scanStartTime || 0);
          var minDelay = 800;
          var remainingDelay = Math.max(0, minDelay - elapsed);

          setTimeout(function () {
            try {
              // 1. Masquer le loader quoi qu'il arrive
              hideScanLoading();

              // 2. Switch step si nécessaire
              if (currentStep !== 4 && typeof switchStep === 'function') {
                switchStep(4);
              }

              // 3. Afficher les résultats
              console.log('[UI] Appel displayScanResults avec:', msg.results);
              displayScanResults(msg.results);

              // 4. Vérifier sélection
              parent.postMessage({ pluginMessage: { type: 'check-selection' } }, '*');

            } catch (innerError) {
              console.error("🔥 ERREUR CRITIQUE dans setTimeout scan-results:", innerError);
              // Fallback d'urgence
              // Removed scanLoadingState related fallback as it's no longer used.
              var scanRes = document.getElementById("scanResults");
              if (scanRes) {
                scanRes.classList.remove('hidden');
                scanRes.style.display = 'flex';
              }
            }
          }, remainingDelay);
          return; // Stop here for scan-results
        }

        // --- AUTRES MESSAGES ---

        if (msg.type === "has-variables") {
          if (msg.value === true) {
            if (!designerView.classList.contains("hidden")) {
              overwriteCheckboxContainer.classList.remove("hidden");
            }
          } else {
            overwriteCheckboxContainer.classList.add("hidden");
          }
        }

        if (msg.type === "existing-tokens") {
          console.log("Message existing-tokens reçu:", msg);
          if (msg.tokens && Object.keys(msg.tokens).length > 0) {
            hasExistingTokens = true;
            existingTokensData = msg.tokens;
            existingLibrary = msg.library || "tailwind";
            if (existingTokensData.brand) {
              var detectedColor = detectPrimaryColorFromTokens(existingTokensData.brand);
              if (detectedColor) {
                currentColor = detectedColor;
                if (colorInput) colorInput.value = currentColor;
                if (colorPicker) colorPicker.value = currentColor;
                updateColorPreview(currentColor);
              }
            }
            // Afficher section analyse
            choiceManageTokens.classList.remove("hidden");
            var sectionAnalyze = document.querySelector('.section-analyze');
            if (sectionAnalyze) sectionAnalyze.style.display = '';

            var libraryNames = { "tailwind": "Tailwind / Shadcn", "mui": "Material UI", "ant": "Ant Design", "bootstrap": "Bootstrap", "chakra": "Chakra UI", "custom": "Custom" };
            existingTokensInfo.textContent = "Librairie : " + (libraryNames[existingLibrary] || existingLibrary);

            // Count tokens
            var totalTokens = 0;
            for (var cat in msg.tokens) { if (msg.tokens.hasOwnProperty(cat)) totalTokens += Object.keys(msg.tokens[cat]).length; }
            existingTokensCount.textContent = totalTokens + " token" + (totalTokens > 1 ? "s" : "");
          } else {
            hasExistingTokens = false;
          }
        }

        if (msg.type === "scan-progress") {
          updateScanProgress(msg.progress, msg.current, msg.total, msg.status);
        }

        if (msg.type === "single-fix-applied") {
          handleSingleFixApplied(msg.appliedCount, msg.error, msg.index);
        }

        if (msg.type === "group-fix-applied") {
          handleGroupFixApplied(msg.appliedCount, msg.error, msg.indices || []);
        }

        if (msg.type === "selection-checked") {
          // 🛡️ STRICT GUARD: Seulement si on est sur l'étape 4
          if (currentStep !== 4) return;

          // 🛡️ PROGRAMMATIC LOCK: Ignorer si un verrou est actif
          if (window.ignoreSelectionChangeUntil && Date.now() < window.ignoreSelectionChangeUntil) {
            console.log("[AutoScan] Changement de sélection ignoré (Verrou actif)");
            return;
          }

          var newSelectionId = msg.selectionId || "";

          // 🛡️ DEBOUNCE & PROTECTION BOUCLE
          if (window.autoScanTimeout) clearTimeout(window.autoScanTimeout);

          window.autoScanTimeout = setTimeout(function () {
            if (msg.hasSelection) {
              // PROTECTION ULTIME : Si c'est la MEME sélection qu'avant, ON NE FAIT RIEN
              // Sauf si on force via un bouton (qui resetterait lastScannedSelectionId)
              if (window.lastScannedSelectionId === newSelectionId && !document.getElementById('scanResults').classList.contains('hidden')) {
                console.log('[AutoScan] Même sélection déjà scannée (' + newSelectionId + '), ignoré.');
                return;
              }

              // Si un scan est DÉJÀ en cours, on ignore
              if (isScanning) {
                console.log('[AutoScan] Scan en cours, ignoré.');
                return;
              }

              console.log('[AutoScan] Nouvelle sélection détectée (' + newSelectionId + ') -> Lancement');

              // Update state
              window.lastScannedSelectionId = newSelectionId;

              // UI Updates
              if (scanEmptyState) scanEmptyState.classList.add('hidden');

              // Lance le flow
              showScanLoading();
              window.scanStartTime = Date.now();
              parent.postMessage({ pluginMessage: { type: 'scan-frame' } }, '*');

              // Bouton update (Optionnel)
              if (scanBtn) {
                scanBtn.disabled = false;
                scanBtn.textContent = "Relancer l'analyse";
                scanBtn.className = "btn-outline";
                scanBtn.onclick = function () {
                  if (isScanning) return;
                  // Force re-scan en effaçant l'ID mémorisé
                  window.lastScannedSelectionId = null;
                  showScanLoading();
                  parent.postMessage({ pluginMessage: { type: 'scan-frame' } }, '*');
                };
              }

            } else {
              console.log('[AutoScan] Pas de sélection');
              // Reset state
              isScanning = false;
              window.lastScannedSelectionId = null; // Reset selection ID so next selection works

              hideScanLoading();

              if (document.getElementById('scanResults')) {
                document.getElementById('scanResults').classList.add("hidden");
                document.getElementById('scanResults').style.display = 'none';
              }

              if (scanEmptyState) {
                scanEmptyState.classList.remove("hidden");
                scanEmptyState.style.display = 'block';
                // Reset content if needed
                if (!scanEmptyState.innerHTML.includes('Sélectionnez une zone')) {
                  scanEmptyState.innerHTML = '<div style="text-align: center; padding: 60px 20px;"><div class="empty-icon">🎯</div><h3>Sélectionnez une zone à auditer</h3><p style="text-align: left; color: var(--poly-text-muted); font-size: 13px; margin: 16px auto; max-width: 320px; line-height: 1.6;">Cliquez sur un calque ou une frame dans Figma.<br>L\'analyse démarrera automatiquement.</p></div>';
                }
              }

              if (scanBtn) {
                scanBtn.disabled = true;
                scanBtn.className = "btn-secondary";
              }
            }
          }, 300); // 300ms debounce
        }

        if (msg.type === "all-fixes-applied") {
          var applyAllSection = document.getElementById("applyAllSection");
          if (applyAllSection) applyAllSection.style.display = 'none';

          var scanResultsList = document.getElementById("unifiedCleaningList");
          if (scanResultsList) scanResultsList.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--poly-success);"><p>✅ ' + msg.appliedCount + ' correction(s) appliquée(s) avec succès !</p></div>';
        }

        if (msg.type === "preview-result" || msg.type === "preview-error" || msg.type === "sync-confirmation") {
          // Log only
          console.log('[UI] Message reçu:', msg.type);
        }

      } catch (globalError) {
        console.error("🔥 GLOBAL UI CRASH:", globalError);
        // Force unlock UI
        hideScanLoading(); // Cela annulera aussi le watchdog
        alert("Une erreur inattendue est survenue. L'interface a été débloquée.");
      }
    };

    // ============================================
    // DIAGNOSTIC FUNCTIONS
    // ============================================

    // Fonction de diagnostic pour déboguer les problèmes de Live Preview
    function diagnoseLivePreviewState() {
      console.log('🔍 === DIAGNOSTIC LIVE PREVIEW ===');

      // 1. État des résultats de scan
      console.log('📊 lastScanResults:', lastScanResults ? lastScanResults.length + ' éléments' : 'NON DÉFINI');
      if (lastScanResults) {
        console.log('📊 Premier élément:', lastScanResults[0]);
      }

      // 2. État des sélecteurs
      var selectors = document.querySelectorAll('.variable-selector');
      console.log('🎛️ Nombre de sélecteurs trouvés:', selectors.length);
      selectors.forEach(function (sel, index) {
        console.log('🎛️ Sélecteur', index + 1, ':', {
          disabled: sel.disabled,
          value: sel.value,
          options: sel.querySelectorAll('option').length,
          visible: sel.offsetParent !== null
        });
      });

      // 3. État du workflow
      console.log('🔄 Current step:', currentStep);

      // 4. État du scan button
      var scanBtn = document.getElementById('scanBtn');
      if (scanBtn) {
        console.log('🔘 Scan button:', {
          disabled: scanBtn.disabled,
          text: scanBtn.textContent,
          visible: scanBtn.offsetParent !== null
        });
      }

      // 5. État des cartes de résultats
      var resultCards = document.querySelectorAll('.cleaning-result-card');
      console.log('📋 Cartes de résultats:', resultCards.length);

      console.log('🔍 === FIN DIAGNOSTIC ===');
    }

    // Fonction de secours pour forcer l'activation du Live Preview (pour débogage)
    function forceEnableLivePreview() {
      console.log('🚨 FORCING LIVE PREVIEW ENABLE...');

      // Forcer les états
      livePreviewReady = true;
      if (!lastScanResults || lastScanResults.length === 0) {
        // Créer des données de test factices
        lastScanResults = [{
          nodeId: 'test-node-1',
          property: 'Fill',
          layerName: 'Test Layer',
          suggestions: [{
            id: 'test-var-1',
            name: 'Test Variable',
            hex: '#FF0000',
            value: '#FF0000'
          }]
        }];
        console.log('🚨 Données de test créées:', lastScanResults);
      }

      // Activer les sélecteurs
      enableVariableSelectors();

      // Notification
      if (typeof figma !== 'undefined' && figma.notify) {
        figma.notify('🚨 Live Preview forcé pour tests', { timeout: 3000 });
      }

      console.log('🚨 LIVE PREVIEW FORCE ENABLED');
    }

    // Fonction pour synchroniser manuellement les résultats de scan
    function syncScanResults() {
      console.log('🔄 SYNC: Tentative de synchronisation des résultats de scan...');
      console.log('🔄 SYNC: lastScanResults disponible:', lastScanResults ? lastScanResults.length + ' éléments' : 'NON');

      if (lastScanResults && lastScanResults.length > 0) {
        parent.postMessage({
          pluginMessage: {
            type: 'sync-scan-results',
            results: lastScanResults
          }
        }, '*');
        console.log('🔄 SYNC: Message de synchronisation envoyé');
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

    function updatePreview() {
      if (!currentTokens) return;

      var categoryData = currentTokens[activeCategory];
      if (!categoryData) {
        tokenPreview.innerHTML = "<p style='color: var(--poly-text-muted); text-align: center; padding: 20px;'>No tokens available for this category.</p>";
        return;
      }

      var isColor = (activeCategory === "brand" || activeCategory === "system" || activeCategory === "gray");

      // Logic to Determine Lock State
      var isCustomLib = (currentNaming === "custom");
      var isLocked = !isCustomLib && !isColor; // Lock if Standard Lib AND Non-Color structure

      var html = "";

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

      html += "<table class='token-table'>";
      html += "<thead><tr>";
      if (isColor) {
        html += "<th style='width: 60px;'>Color</th>";
        html += "<th style='width: 120px;'>Name</th>"; // Fixed width
      } else {
        html += "<th style='width: 180px;'>Name</th>"; // Wider name if no color
      }
      html += "<th>Value</th>"; // Flexible width

      // ONLY show Actions header if Custom
      if (isCustomLib) {
        html += "<th style='width: 60px;'>Actions</th>";
      }
      html += "</tr></thead><tbody>";

      for (var key in categoryData) {
        if (!categoryData.hasOwnProperty(key)) continue;
        var value = categoryData[key];

        html += "<tr>";
        if (isColor) {
          html += "<td><div class='color-swatch' style='background-color: " + value + ";'></div></td>";
        }
        html += "<td class='token-name'>" + activeCategory + "-" + key + "</td>";

        // Value Column (Conditional Render)
        html += "<td>";
        if (isLocked) {
          // LOCKED DISPLAY (Disabled Input, no Icon)
          // We keep the <input> tag to ensure perfect alignment with editable rows
          html += "<input type='text' class='table-input locked' value='" + value + "' disabled />";
        } else {
          // EDITABLE INPUT (Standard)
          html += "<input type='text' class='table-input' data-token-key='" + key + "' value='" + value + "' />";
        }
        html += "</td>";

        // Action Column: ONLY if Custom
        if (isCustomLib) {
          html += "<td style='text-align: center;'>";
          html += "<button class='btn-icon' onclick='deleteToken(\"" + key + "\")' title='Delete' style='color: var(--poly-error);'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 6h18'/><path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'/><path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'/></svg></button>";
          html += "</td>";
        }
        html += "</tr>";
      }

      html += "<tr class='add-token-row' style='background: rgba(138, 213, 63, 0.05);'>";
      if (isColor) {
        html += "<td><div class='color-swatch' style='border: 1px dashed var(--poly-border-subtle); background: transparent;'></div></td>";
      }
      html += "<td><input type='text' id='newTokenKey' class='table-input' placeholder='Nom (ex: 500)' /></td>";
      html += "<td><input type='text' id='newTokenValue' class='table-input' placeholder='Valeur' /></td>";

      if (isCustomLib) {
        html += "<td style='text-align: center;'>";
        html += "<button class='btn-icon' onclick='quickAddToken()' title='Ajouter'><span class='icon' style='color: var(--poly-accent); font-weight: bold; font-size: 18px;'>+</span></button>";
        html += "</td>";
      }
      html += "</tr>";

      html += "</tbody></table>";

      tokenPreview.innerHTML = html;

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
          .replace(/('.*?')|(".*?")/g, '<span class="syn-string">$1</span>')
          .replace(/\b(module|exports|const|var|let|return|function|theme|extend)\b/g, '<span class="syn-kwd">$1</span>')
          .replace(/(\b\d+\b)/g, '<span class="syn-number">$1</span>');
      }

      return code;
    }

    var rawExportContent = "";
    var codeEditor = document.getElementById("codeEditor");

    function updateExport() {
      if (!currentTokens) return;

      var format = exportFormat.value;
      var output = "";

      if (format === "css") {
        output = ":root {\n";
        for (var category in currentTokens) {
          if (!currentTokens.hasOwnProperty(category)) continue;
          for (var key in currentTokens[category]) {
            if (!currentTokens[category].hasOwnProperty(key)) continue;
            output += "  --" + category + "-" + key + ": " + currentTokens[category][key] + ";\n";
          }
        }
        output += "}";
      } else if (format === "json") {
        output = JSON.stringify(currentTokens, null, 2);
      } else if (format === "tailwind") {
        output = "module.exports = {\n  theme: {\n    extend: {\n";
        for (var category in currentTokens) {
          if (!currentTokens.hasOwnProperty(category)) continue;
          output += "      " + category + ": {\n";
          for (var key in currentTokens[category]) {
            if (!currentTokens[category].hasOwnProperty(key)) continue;
            output += "        '" + key + "': '" + currentTokens[category][key] + "',\n";
          }
          output += "      },\n";
        }
        output += "    }\n  }\n}";
      } else if (format === "scss") {
        for (var category in currentTokens) {
          if (!currentTokens.hasOwnProperty(category)) continue;
          for (var key in currentTokens[category]) {
            if (!currentTokens[category].hasOwnProperty(key)) continue;
            output += "$" + category + "-" + key + ": " + currentTokens[category][key] + ";\n";
          }
        }
      }

      rawExportContent = output;

      // Determine syntax lang
      var lang = 'css'; // default
      if (format === 'json') lang = 'json';
      if (format === 'tailwind') lang = 'js';
      if (format === 'scss') lang = 'scss';

      codeEditor.innerHTML = highlightSyntax(output, lang);
    }

    exportFormat.addEventListener("change", updateExport);

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

    // Download File Logic
    downloadBtn.addEventListener("click", function () {
      const content = rawExportContent;
      const format = exportFormat.value;
      if (!content) return;

      let filename = "tokens";
      let mimeType = "text/plain";

      switch (format) {
        case 'css':
          filename += ".css";
          mimeType = "text/css";
          break;
        case 'json':
          filename += ".json";
          mimeType = "application/json";
          break;
        case 'tailwind':
          filename = "tailwind.config.js";
          mimeType = "text/javascript";
          break;
        case 'scss':
          filename += ".scss";
          mimeType = "text/x-scss";
          break;
        default:
          filename += ".txt";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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

  