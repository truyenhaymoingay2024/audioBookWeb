const CONFIG = {
    siteName: "Tư Ngữ Audio",
    avatar: "./avt.jpg",
    rootPath: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main"
};

// --- HELPER FUNCTIONS (Khu vực xử lý logic) ---
// Hàm tạo 1 track đơn lẻ
// s: start (bắt đầu), e: end (kết thúc), p: part (phần, nếu có), sfx: suffix (hậu tố như "Hết", "Hoàn")
const tr = (s, e, p = null, sfx = '', ext = 'mp3', prefix = 'Chương') => {
    const partStr = p ? ` (${p})` : '';
    const sfxStr = sfx ? ` (${sfx})` : '';
    const fileBase = p ? ` (${p})` : '';
    
    // Xử lý logic tên file: c1-20.mp3 hoặc c1-20 (1).mp3
    // Một prefix khác "c" (như ngoại truyện), nhưng đa số là c
    let filePrefix = 'c';
    if (prefix === 'Ngoại truyện' || prefix === 'Phiên ngoại') filePrefix = 'nt'; // Tuỳ chỉnh logic nếu cần

    // Nếu title là Chương X-Y -> file là cX-Y
    // Nếu title là Ngoại truyện X-Y -> file là ntX-Y   
    return {
        title: `${prefix} ${s} - ${e}${partStr}${sfxStr}`,
        fileName: `${filePrefix === 'nt' ? 'nt' : 'c'}${s}-${e}${fileBase}.${ext}`
    };
};

// Hàm tạo một dải track tự động (Dùng cho truyện dài như ID 9, 12)
// step: bước nhảy (ví dụ 5 chương 1 file, hoặc 10 chương 1 file)
const batch = (start, end, step, ext = 'mp3') => {
    const tracks = [];
    for (let i = start; i <= end; i += step) {
        // Tính toán điểm kết thúc của chunk này. 
        // Ví dụ: start 1, step 5 -> 1-5. Nhưng nếu end là 18 mà step 5 -> 16-18 (xử lý đoạn cuối)
        let chunkEnd = i + step - 1;
        if (chunkEnd > end) chunkEnd = end;
        tracks.push(tr(i, chunkEnd, null, '', ext));
    }
    return tracks;
};

// Hàm custom cho trường hợp đặc biệt (Manual)
const manual = (title, fileName) => ({ title, fileName });

// Hàm tạo chương đơn (Ví dụ: Chương 1 -> c1.mp3)
const single = (c, ext = 'mp3', prefix = 'Chương') => {
    // Xử lý prefix file: nếu là Ngoại truyện -> nt1.mp3, còn lại là c1.mp3
    let filePrefix = 'c';
    if (prefix.toLowerCase().includes('ngoại') || prefix.toLowerCase().includes('phiên')) {
        filePrefix = 'nt';
    }

    return {
        title: `${prefix} ${c}`,
        fileName: `${filePrefix}${c}.${ext}`
    };
};

// Hàm tạo dải chương đơn tự động (Ví dụ: c1.mp3, c2.mp3, ... c10.mp3)
// Dùng khi bạn có folder chứa 100 file mp3 riêng biệt
const batchSingle = (start, end, ext = 'mp3') => {
    const tracks = [];
    for (let i = start; i <= end; i++) {
        tracks.push(single(i, ext));
    }
    return tracks;
};

// Mock Data
const LIBRARY = [
    {
        id: 1,
        folderName: "GiayTrangVaThich",
        title: "Giấy Trắng Và Thích",
        author: "Thập Thanh Yểu",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/GiayTrangVaThich/cover.png",
        desc: "Cô không nhớ nhiều chuyện của năm đó, ký ức thanh xuân ngoại trừ anh mà nói đối với cô rất ít.",
        isH: false,
        chapters: 2,
        tracks: [
            tr(1, 2, null, "Hết")
        ]
    },
    {
        id: 2,
        folderName: "PhongHoaHoaCot",
        title: "Phong Hoa Hoạ Cốt",
        author: "Khúc Tiểu Khúc",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/PhongHoaHoaCot/cover.png",
        desc: "[1]\nTạ Thanh Yến là đệ nhất nho tướng của triều Đại Dận, là người mang phong thái thanh khiết như gió xuân trăng sáng, nhã nhặn đoan chính, lập vô số chiến công hiển hách. Vì thế mà được người đời tôn xưng là “Xuân Sơn công tử”, thiên hạ ca tụng rằng: “Một lần gặp ngày xuân về, khắp kinh thành đỏ rực tay áo vẫy chào.”\nTrong triều, ai ai cũng ngưỡng mộ và tôn kính chàng, các tiểu thư quyền quý nơi kinh thành lại coi chàng như đấng lang quân trong mộng cao cao tại thượng, đến cả biểu muội của chàng là Trưng Dương công chúa cũng thầm thương trộm nhớ, dây dưa chẳng dứt.\nĐáng tiếc là chàng đã đính ước hôn nhân với Khánh Quốc Công phủ, chỉ chờ đích nữ trong phủ là Thích Uyển Nhi đến ngày xuất giá là sẽ kết duyên, tạo nên một câu chuyện đẹp.\nTin đồn kết thân vừa lan ra, trái tim của hàng ngàn thiếu trong nữ kinh thành tan vỡ chỉ sau một đêm, nhưng chỉ có một người thở phào nhẹ nhõm —\nĐó chính là Thích Bạch Thương, con gái thứ và là chị cùng cha khác mẹ của Thích Uyển Nhi – vị hôn thê tương lai của Tạ Thanh Yến.\n\n[2]\nThích Bạch Thương vẫn luôn biết rằng, trong mắt Tạ Thanh Yến, nàng chỉ là vật thay thế cho đích muội Thích Uyển Nhi mà thôi.\nĐích muội tôn quý, dịu dàng và nhã nhặn, cầm kỳ thi họa nổi danh kinh thành, được ca tụng là Đệ nhất tài nữ kinh đô.\nCòn nàng thì xuất thân thấp kém và thô thiển, thậm chí còn mang tai tiếng hồi nhỏ từng lưu lạc ở thanh lâu suốt một năm.\nThế nên Tạ Thanh Yến khinh rẻ và trêu đùa nàng. Ban ngày, chàng đối diện với đích muội ôn hòa và giữ lễ như một quân tử đoan chính, nhưng đêm đến lại xé toạc lớp vỏ bọc, đối xử với nàng bằng sự tàn bạo và ác ý tột cùng trong màn trướng uyên ương.\nChàng nâng đỡ đích muội nàng lên tận mây xanh, nhưng lại nhấn chìm nàng xuống bùn nhơ.\nNhưng trớ trêu thay, đối với Thích Bạch Thương, Uyển Nhi lại là cô gái tốt nhất trong triều Đại Dận. Trong Quốc Công phủ rộng lớn, vô số ánh mắt lạnh lùng, nàng từ nhỏ động một tí là mắc lỗi, chỉ có Uyển Nhi là tương trợ và đỡ đần nàng. Nàng lại càng không thể đến trước mặt Uyển Nhi mà vạch trần bộ mặt thật của người kia.\n“Hôm nay, Uyển Nhi lại cùng công tử nhà họ Tần nhìn nhau thêm hai lần.”\nĐêm đã khuya, người đàn ông ban ngày thanh chính nho nhã lúc này lại như một quái thú lười biếng hung dữ, dựa vào bức tường trong căn phòng thứ nữ chật hẹp và cũ nát của nàng. Chàng tiện tay vò chiếc áo choàng lụa gấm quý giá ở dưới thân nàng, chàng cố ý và ác ý gợi ra những tiếng khóc nức nở khó nén của nàng:\n“Tối nay, ngươi hãy thay nàng chịu phạt đi —”\n“Thêm hai nén hương nữa là được.”\n\n[3]\nCuối cùng, mối thù của mẹ ruột đã được báo, Thích Bạch Thương không cần phải giả vờ làm thân với bất kỳ ai nữa, nàng quyết định rời khỏi kinh đi.\nVào lúc này, Tạ Thanh Yến đã đạt được ước nguyện bấy lâu và sắp kết hôn cùng Thích Uyển Nhi. Thích Bạch Thương cũng đã tìm được cho mình một người chồng như ý. Đối phương tuy xuất thân có phần thấp kém hơn, nhưng lại không chê bai tiếng tăm của nàng, đối xử chân thành với nàng, và sẵn lòng kết hôn, cưới nàng về làm vợ.\nThích Bạch Thương cứ nghĩ rằng mình đã có thể thoát khỏi nanh vuốt của ma quỷ rồi.\nTuy nhiên nàng không ngờ rằng, đêm đó khi khăn che mặt màu đỏ được vén lên, người xuất hiện trước mặt nàng lại chính là Tạ Thanh Yến – người đáng lẽ ra phải đang cử hành hôn lễ với Uyển Nhi ở trong kinh thành hoa lệ nhất.\nKẻ điên này vẫn đang mặc y phục tân lang, đai lụa vàng ngọc, trong khi đó tân lang của nàng lại bị trói dưới đất, phía sau, cửa phòng tân hôn mở toang, trong sân đèn đuốc sáng trưng. Huyền Khải Quân áo giáp đen lạnh lẽo, áo giáp uy nghiêm, lưỡi đao sáng như tuyết.\nTạ Thanh Yến đứng một mình trước hàng quân, dùng ánh mắt hung ác và đầy sát khí như muốn xé xác nuốt trọn nàng mà quét qua, rồi lại bật cười.\n“Dám chạy trốn? Tốt lắm.”\nChàng nắm lấy dải lụa thắt ở giá y của nàng, rồi từ từ kéo ra: “Vậy đêm nay, cứ để cho thiên hạ tận mắt thấy, ta sẽ làm tân lang của ngươi trong đêm này như thế nào.”\n\n—\n\n[Lưu ý trước khi đọc]\n(1) Văn án có chứa yếu tố tự sự lừa dối từ góc nhìn đơn nhất, bao gồm các yếu tố cẩu huyết như: án cũ nhiều năm, thù lớn gia tộc, cưỡng ép chiếm đoạt, tình yêu và thù hận, yêu mà không thể nói. Không khuyến khích những người không thích thể loại này mà còn hay vặn vẹo và bắt bẻ đọc.\n(2) Nam chính không yêu bất kỳ ai ngoài nữ chính, bao gồm cả chính bản thân hắn, nhưng hắn lại cực kỳ tồi tệ, vừa tồi tệ lại vừa điên cuồng.\n(3) Bối cảnh giả tưởng, chế độ bối cảnh được pha trộn.\n\n—\n\nTóm tắt một câu: Vợ chồng có mối thù truyền kiếp, vừa hận vừa yêu.\nÝ tưởng chính: Minh oan cho nỗi oan khuất, dẹp loạn chỉnh lại trật tự.\nTags: Cung đấu – Chỉ yêu một người – Trời sinh một cặp – Yêu hận đan xen – Báo thù và hành hạ kẻ cặn bã – Chính kịch.\n【Song phục thù, Minh oan và lật lại bản án; Cưỡng ép chiếm đoạt, Tình yêu rộng lớn như trời, hận thù sâu như biển】",
        isH: false,
        chapters: 95,
        tracks: [
            ...batch(1, 85, 5, 'm4a'),
            manual("Chương 86 - 88 (Hoàn chính văn)", "c86-88.m4a"),
            manual("Ngoại truyện 1 - 5", "nt1-5.m4a"),
            manual("Ngoại truyện 6 - 7 (Hết)", "nt6-7.m4a")
        ]
    },
    {
        id: 3,
        folderName: "CoGaiBenToi10NamKetHonRoi",
        title: "Cô Gái Bên Tôi 10 Năm Kết Hôn Rồi",
        author: "Lý Hải Ba",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/CoGaiBenToi10NamKetHonRoi/cover.jpg",
        desc: "Chiều hôm qua, Lăng Nhất Nghiêu gửi cho tôi một tấm hình, là hình mặc váy cưới, cô ấy hỏi tôi đẹp hay không, tôi nói cũng tạm.\nCô ấy nói: 'Ngày 5 sẽ tổ chức hôn lễ, giống y như trước đây chúng ta từng tưởng tượng, có cổng hoa, có thảm đỏ, có sare trắng vest đen, chỉ là không có cậu.'\nTôi nói: 'Có cần mình đến dự không?'\nRất lâu sau đó cô ấy mới nói: 'Không cần đâu.'\nChiếc vòng kim cô này, cả đời tôi cũng không thể tháo xuống được.\n\n_________\n\nGIỚI THIỆU:\nTên nguyên bản là 与我长跑10年的女朋友就要嫁人了 được một người kể trên Douban từ tháng 1 năm 2013.\nCâu chuyện tình yêu cảm động khắc cốt ghi tâm và thực tế đến đau lòng này nhận được rất nhiều sự quan tâm của độc giả và thính giả Trung Quốc.\nTheo một số nguồn tin, trừ tên hai nhân vật chính, tất cả nhân vật và địa điểm trong truyện đều có thật. Về việc câu chuyện này có thật hay không, phóng viên và người hâm mộ đã nhiều lần liên hệ tác giả để hỏi về tính chân thực và cái kết thực sự của câu chuyện, nhưng không nhận được câu trả lời.",
        isH: false,
        chapters: 13,
        tracks: [
            ...batch(1, 10, 5, 'm4a'),
            manual("Chương 11 - 13 (Hết)", "c11-13.m4a")
        ]
    },
    {
        id: 4,
        folderName: "MuoiLamNamChoDoiChimDiTru",
        title: "Mười Lăm Năm Chờ Đợi Chim Di Trú",
        author: "Doanh Phong",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/MuoiLamNamChoDoiChimDiTru/cover.jpg",
        desc: "15 năm chờ đợi chim di trú - Yêu đơn phương có vị gì?\n“Bùi Thượng Hiên lặng lẽ hỏi Lê Ly: ‘Dù chúng ta rất thân thiết, nhưng tớ lại chẳng thể nào nhìn ra tâm tư của cậu.’\nLê Ly nở nụ cười đã quen thuộc với anh suốt 15 năm qua, nhẹ nhàng trả lời: ‘Bởi vì, cậu không yêu tớ.’”\nNăm 13 tuổi, vào ngày đầu tiên bước chân vào trường trung học, Lê Ly đã chú ý ngay đến cậu thiếu niên phóng khoáng - Bùi Thượng Hiên. Tựa như ánh dương rực rỡ, Bùi Thượng Hiên đã đến sưởi ấm cho cuộc sống tẻ nhạt của cô mà chẳng một lời báo trước.\nVào ngày sinh nhật tròn 14 tuổi, Lê Ly nhận được món quà ấm áp nhất trong cuộc đời mình – lại cũng chính là từ Bùi Thượng Hiên. Kể từ ngày hôm ấy, cô và cậu thiếu niên đó đã kết nên mối nhân duyên khắc cốt ghi tâm kéo suốt 15 năm dài đằng đẵng.\n15 năm… mỗi một năm mới đến, ước nguyện của Lê Ly luôn là: Năm nay sẽ không còn thích Bùi Thượng Hiên nữa. Nhưng ước nguyện đó chưa khi nào trở thành hiện thực.\nThì ra một ánh mắt cũng có thể khiến cô vui vẻ đến thế.\nThì ra một cái chạm tay có thể khiến trái tim xao xuyến đến vậy.\nThì ra chỉ cần cậu ấy mỉm cười thôi, cô đã chẳng cầu gì hơn.\nTình yêu thê lương mà đẹp đẽ ấy, cô dành trọn 15 năm để viết nên, đợi chờ anh tựa như cánh chim di trú trở về...\n15 năm chờ đợi, cuộc đời con người liệu có được mấy lần 15 năm?\nNhưng Lê Ly lại vốn không bận tâm đến việc chờ đợi, chỉ cần người cuối cùng cô đợi được chính là Bùi Thượng Hiên.",
        isH: false,
        chapters: 16,
        tracks: [
            ...batchSingle(1, 15, 'm4a'),
            manual("Chương 16 (Hết)", "c16.m4a")
        ]
    },
    {
        id: 5,
        folderName: "MuoiNamSauKhiToiChet",
        title: "Mười Năm Sau Khi Tôi Chết",
        author: "Sầm Khương",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/MuoiNamSauKhiToiChet/cover.jpg",
        desc: 'Mười năm sau khi tôi chết.\nMười năm dần bị lãng quên.',
        isH: false,
        chapters: 12,
        tracks: [
            manual("Chương 1 - 6", "c1-6.m4a"),
            manual("Chương 7 - 12 (Hết)", "c7-12.m4a")
        ]
    },
    {
        id: 6,
        folderName: "MotNgayLaThayCaDoiLaChong",
        title: "Một Ngày Là Thầy, Cả Đời Là Chồng",
        author: "Cật Liễu Mộc Ngư Đích Miêu",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/MotNgayLaThayCaDoiLaChong/cover.jpg",
        desc: 'Triều Tấn từ khi Nữ Đế thượng vị, vị trí nữ tử phát triển không ngừng, cấm chế độ năm thê bảy thiếp, nữ tử cũng có thể kế thừa gia sản.\nDương Nhược Thanh, xuất thân nhà buôn bán , Nữ đế triều Tấn ban thưởng nữ phu tử.\nLâu Ngữ Tuyết, con gái của một nhà giàu .\nHai người quen biết ở trường học, là thân phận  phu tử và học trò, Ngữ Tuyết ba lần mấy lượt cố ý, Nhược Thanh chịu không được hấp dẫn, tuy vẫn tiếp tục bày ra tư thế nghiêm túc cũng thì đã trễ.\n"Phu quân, phụ thân kêu chúng ta sớm trở về."\n"Khụ, ở trong thư viện vẫn là kêu phu tử đi."\n"Phu tử, đêm động phòng hoa chúc há có thể như thế cô phụ."\n"Khụ, ở nhà vẫn là kêu phu quân đi."\n"Phu tử, ngươi rất ưa thích nhi đồng?"\n"... Ân."\n"Vậy ngươi cần phải cố gắng đó."\n"Cố gắng cái gì?"\n"Tự nhiên là tránh bạc , cũng không nên hiểu sai ."\n"Ta mới không có hiểu sai. Ta nói tất cả bao nhiêu lần, ở nhà không cần kêu phu tử."\n"Ta thích ở thư viện gọi ngươi phu quân, ở nhà gọi ngươi phu tử."\n"..."\n"Không được sao?"\n"Được, ngươi thích là được."',
        isH: false,
        chapters: 19,
        tracks: [
            ...batch(1, 15, 5, 'm4a'),
            manual("Chương 16 - 19 (Hết)", "c16-19.m4a")
        ]
    },
    {
        id: 7,
        folderName: "HoDiepVaKinhNgu",
        title: "Hồ Điệp Và Kình Ngư",
        author: "Tuế Kiến",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/HoDiepVaKinhNgu/cover.jpg",
        desc: '“Tuổi thọ của một con bướm nằm trong khoảng ba ngày đến một tháng, mà đa số các con bướm chỉ có một tuần tuổi thọ.”\n“Em cũng giống chúng vậy, sinh mạng chỉ kéo dài vài tháng thôi, có lẽ còn ngắn hơn thế nữa.”\n_\n\nLần đầu tiên Hồ Điệp gặp Kinh Du, anh cho rằng cô là thiếu nữ chán đời muốn tự tử.\nLần thứ hai gặp nhau, anh chẳng mấy bận tâm nói với Hồ Điệp rằng: “Hôm nay nếu cậu nhảy xuống thì tôi sẽ không cứu cậu nữa đâu.”\nVề sau lại đến cô bảo anh: “Kinh Du, đừng đau khổ vì em.”\nThật lâu sau này, Kinh Du trở lại sân đấu và đạt được vinh quang thuộc về mình.\nDưới ánh đèn sáng ngời, anh chợt nhớ lại giọng nói và dáng vẻ của cô thiếu nữ ấy rồi thốt ra một câu không đầu không đuôi trước muôn vàn người —– “Anh không đau khổ, chỉ là cảm thấy vào khoảnh khắc này, có em ở đây thì sẽ tốt hơn biết bao.”\n“Anh là cá voi ngao du đại dương, chợt vào một ngày tình cờ, một chú bướm vô tình xông vào tần số của anh. Đó là giây phút đẹp đẽ nhất trong cuộc đời anh.”\n*\n\nThiếu nữ mắc bệnh ung thư x Thiếu niên bơi lội\nTruyện ngắn/BE\nHồ Điệp là vận động viên trượt băng nghệ thuật, sau đó cô qua đời vào mùa hè\nCâu đầu tiên trong văn án là nguồn internet\nTag: Hoa quý mùa mưa, nhân duyên tình cờ gặp gỡ, thiên chi kiều tử\nNhân vật chính: Hồ Điệp, Kinh Du\nMột câu giới thiệu đơn giản: Khoảnh khắc đẹp đẽ nhất trong cuộc đời\nLập ý: Dù cho con đường phía trước đầy khó khăn, cũng đừng quên mất ước mơ',
        isH: false,
        chapters: 19,
        tracks: [
            ...batch(1, 15, 5, 'm4a'),
            manual("Chương 16 - 19 (Hết)", "c16-19.m4a")
        ]
    },
    {
        id: 8,
        folderName: "TruocKhiAnhDen",
        title: "Trước Khi Anh Đến",
        author: "Trà Hoa Đậu Biếc",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/TruocKhiAnhDen/cover.jpg",
        desc: 'Tôi từng nghĩ đến cái chết rất nhiều lần.\nMỗi đêm, tôi tự tưởng tượng ra hàng nghìn viễn cảnh về cái chết của bản thân. Có thể tôi sẽ chết vì bị xe đâm, có thể tôi sẽ được chứng kiến sự sống của chính mình dần xói mòn do mất máu quá nhiều, hoặc tôi sẽ nát vụn dưới chân tòa nhà vài chục tầng... Tôi mường tượng đến rất nhiều trường hợp, nhưng chưa một lần nghĩ mình sẽ chết già.\n\nTrích đoạn 1:\nTôi từng nghĩ đến cái chết rất nhiều lần.\nMỗi đêm, tôi tự tưởng tượng ra hàng nghìn viễn cảnh về cái chết của bản thân. Có thể tôi sẽ chết vì bị xe đâm, có thể tôi sẽ được chứng kiến sự sống của chính mình dần xói mòn do mất máu quá nhiều, hoặc tôi sẽ nát vụn dưới chân tòa nhà vài chục tầng... Tôi mường tượng đến rất nhiều trường hợp, nhưng chưa một lần nghĩ mình sẽ chết già.\n\nTrích đoạn 2:\nAnh ôm siết lấy eo tôi, cúi đầu hôn thật lâu lên đầu vai tôi, thì thầm:\n"Trông giống thân con bướm thật đấy..."\n"Dạ?" Tôi nghiêng đầu, vươn tay khẽ vuốt ve khuôn mặt đẹp như tượng tạc của anh, "Cái gì giống thân con bướm?"\nHơi ấm và mùi gỗ tuyết tùng pha lẫn hương bạc hà dìu dịu tỏa ra trên người anh khiến cơ thể tôi vô thức thả lỏng, tôi thoải mái ngả người ra phía sau, tận hưởng sự âu yếm của anh.\n"Hình xăm dấu chấm phẩy của em..." Anh dùng một tay ôm tôi, tay kia mân mê vùng da thịt ở đầu vai tôi, giọng nói vừa trầm vừa dịu dàng, "Giống thân con bướm ấy."\n"Thật á?" Tôi ngoái đầu lại, ngó chằm chằm hình xăm trên đầu vai một lúc lâu, sau đó bật cười, "Cũng hơi giống nhỉ?"\n"Đợi anh một chút nhé." Trường chợt vươn tay lấy cây bút trên bàn, anh kéo một bên dây áo của tôi xuống, ngay sau đó tôi cảm giác đầu bút chậm rãi di chuyển trên da. Đầu bút nhòn nhọn, hơi lành lạnh khiến tôi vô thức cựa quậy.\n"Ngồi yên nào." Trường cười khẽ, xoa đầu tôi, "Xong rồi."\n"Ôi..." Tôi sửng sốt nhìn con bướm xinh đẹp đang tung cánh trên đầu vai, lẩm bẩm, "Đẹp quá."\n"Thích không?" Trường cong môi cười, dùng cả hai tay ôm lấy mặt tôi, đôi mắt đẹp sâu thăm thẳm ngập tràn hình bóng tôi.\n"Em thích lắm." Tôi nở nụ cười thật tươi, nhưng mi mắt thì ướt nhòe, "Cảm ơn anh."',
        isH: false,
        chapters: 55,
        tracks: [
            ...batch(1, 50, 5, 'm4a'),
            manual("Chương 51 - 55 (Hết)", "c51-55.m4a")
        ]
    },
    {
        id: 9,
        folderName: "AnhNgheKiaLaAmThanhThuoDo",
        title: "Anh Nghe Kìa Là Âm Thanh Của Thuở Đó",
        author: "Liêm Thập Lí",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/AnhNgheKiaLaAmThanhThuoDo/cover.jpg",
        desc: 'Chúng ta đừng ở đây\nTheo em quay lại năm mười tám tuổi\nTrốn dưới bụi hoa đỗ quyên ở vườn trường\nĐừng để bị vận mệnh tìm thấy.',
        isH: false,
        chapters: 17,
        tracks: [
            ...batch(1, 15, 5, 'm4a'),
            manual("Chương 16 - 17 (Hết)", "c16-17.m4a")
        ]
    },
    {
        id: 10,
        folderName: "LaRoiKhongVet",
        title: "Lá Rơi Không Vết",
        author: "Chưa Rõ",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/LaRoiKhongVet/cover.jpg",
        desc: 'Có một hôm ngồi vu vơ, mình lại quay sang thủ thỉ với người thương: "Anh biết không, vì yêu mà yêu là thần, vì bị yêu mà yêu là người. Em đọc được nó trong một câu truyện, em nghĩ chính em cũng giống như anh nam chính , vì cảm động trước tình cảm của đối phương mà đã yêu từ mọi ngóc ngách sâu nhất trong tâm hồn."',
        isH: false,
        chapters: 3,
        tracks: [
            manual("Chương 1 - 3 (Hết)", "c1-3.m4a")
        ]
    },
    {
        id: 11,
        folderName: "ManThienHoaVu",
        title: "Mạn Thiên Hoa Vũ",
        author: "Thường Yên",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/ManThienHoaVu/cover.jpg",
        desc: 'Mạn Thiên Hoa Vũ được lấy bối cảnh dưới thời vua Trần Anh Tông, vị hoàng đế thứ tư của Hoàng triều Trần trong lịch sử Việt Nam.',
        isH: false,
        chapters: 87,
        tracks: [
            ...batch(1, 50, 5, 'm4a'),
            manual("Chương 51 - 52 (Hoàn quyển 1)", "c51-52.m4a"),
            ...batch(53, 82, 3, 'm4a'),
            manual("Chương 83 - 87 (Hoàn quyển 2)", "c83-87.m4a"),
        ]
    },
    {
        id: 12,
        folderName: "ThienHaKyDuyen",
        title: "Thiên Hạ Kỳ Duyên",
        author: "Ánh Tuyết Triều Dương",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/ThienHaKyDuyen/cover.jpg",
        desc: 'HIỆN MÌNH CHỈ MỚI TÌM ĐƯỢC 61 CHƯƠNG CỦA BỘ NÀY, SỐ CHƯƠNG CỤ THỂ MÌNH KHÔNG RÕ NHƯNG MÌNH BIẾT NÓ VẪN CÒN, BẠN NÀO CÓ THÔNG TIN NGUỒN PHẦN CÒN LẠI THÌ CHO MÌNH XIN NHA\n\n\nKhi Lệ Chi viên oan nghiệt rúng động một thời, cũng chỉ là mắt xích trong một hành trình trả thù đầy máu và nước mắt...\nKhi hậu duệ của những cố nhân hiển hách năm xưa cùng kỳ ngộ, ván cờ giữa họ sẽ là ván cờ giang sơn!\n...\nThiên hạ kỳ duyên là tiểu thuyết hư cấu lấy bối cảnh Đại Việt những năm đầu thời vua Lê Thánh Tông. Hình tượng các nhân vật, hệ thống các sự kiện xảy ra trong truyện hoàn toàn là sự hư cấu của tác giả, không đi ngược lại kết cục lịch sử nhưng cũng không phải diễn biến lịch sử khách quan.\n\nTruyện có tham khảo một số tài liệu sau:\n1. Đại Việt sử ký toàn thư (quyển 2)- Ngô Sĩ Liên - NXB Thời đại - năm 2013.\n2. Đại Việt thông sử (quyển 1) - Lê Quý Đôn - NXB Trẻ - năm 2012.\n3. Việt Nam sử lược - Trần Trọng Kim - NXB Văn hóa Thông tin - năm 2008.\n4. Lịch triều hiến chương loại chí - Phan Huy Chú - NXB Trẻ - năm 2014.\n5. Bên lề chính sử - Đinh Công Vĩ - NXB Văn hóa Thông tin - năm 2005.\n6. Ngàn năm áo mũ - Trần Quang Đức - NXB Thế giới và Nhã Nam - năm 2013.\nVà một số tài liệu khác.',
        isH: false,
        chapters: 61,
        tracks: [
            ...batch(1, 20, 5, 'm4a'),
            manual("Chương 21 - 24 (Hoàn quyển 1)", "c21-24.m4a"),
            manual("Chương 25 - 30", "c25-30.m4a"),
            ...batch(31, 40, 5, 'm4a'),
            manual("Chương 41 - 45 (Hoàn quyển 2)", "c41-45.m4a"),
            manual("Chương 46 - 50", "c46-50.m4a"),
            manual("Chương 51 - 52", "c51-52.m4a"),
            ...batch(53, 61, 3, 'm4a'),
        ]
    },
    {
        id: 13,
        folderName: "GiaNhuMinhDungGapGo",
        title: "Giá Như Mình Đừng Gặp Gỡ",
        author: "Mười Bốn Quân Cờ",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/GiaNhuMinhDungGapGo/cover.jpg",
        desc: 'Thể loại: Hiện đại, góc nhìn nữ chủ, ngược nữ trước ngược nam sau, BE.\n\nVăn án:\nNăm thứ tư kết hôn với Tống Tùy, bạch nguyệt quang của anh ấy ly hôn về nước.\nĐể cho mọi thứ tồi tệ hơn thì lúc này tôi mắc bệnh ung thư sắp ch.ết.\nTrong vòng chưa đầy nửa năm còn lại của đời người, tôi luôn đóng vai một người vợ tốt của anh ấy.\nCho đến khi tôi qua đời, mà Tống Tùy đọc được nhật ký tôi để lại cũng hoàn toàn sụp đổ.',
        isH: false,
        chapters: 10,
        tracks: [
            manual("Chương 1 - 10 (Hết)", "c1-10.m4a"),
        ]
    },
    {
        id: 14,
        folderName: "LamSaoMoiCoTheQuenDuocAnh",
        title: "Làm Sao Mới Có Thể Quên Được Anh",
        author: "Nhĩ Giả",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/LamSaoMoiCoTheQuenDuocAnh/cover.jpg",
        desc: 'Thể loại : Ngôn tình, hiện đại, đoản văn, thị giác nữ chủ, thanh xuân vườn trường, BE\n\nVăn án:\n“Xin em đừng nhớ anh nữa” dưới góc nhìn của nữ chính.\n[Sau khi ở bên người mình đã yêu đơn phương nhiều năm, vào năm yêu nhau nhất đó, anh lại rời đi.]\nA Vọng, 10 năm trước, em hỏi anh: “Mười năm sau anh đang làm gì nhỉ?”\nLúc đó anh ôm em rồi nói: “Mười năm sau, chúng ta sẽ kết hôn sinh con.” Bây giờ, em nói anh nghe đáp án: 10 năm sau, chúng ta không kết hôn, cũng không ở bên nhau, thậm chí trên thế giới này chẳng có ai nhớ anh nữa.\nAnh lúc đó thường gọi em là nhóc thúi, bây giờ không thể gọi em như thế được, em đã lớn hơn anh nhiều tuổi rồi, mà anh, mãi mãi trẻ trung, mãi là dáng vẻ hăng hái đó, mãi là thiếu niên.\nKhông phải anh bảo em mà khóc thì anh sẽ luôn dỗ em sao? Anh là tên lừa đảo.\nĐời người thường nhìn về phía trước, bây giờ em thật sự sống rất tốt.\nEm sắp không giữ được lời hứa rồi, em sẽ không nhớ anh nữa đâu.\nEm ghét anh, chẳng nói câu nào cả.\nDây tơ hồng đã phai màu rồi.\nA Vọng, xin lỗi anh. A Vọng, tạm biệt.\n[Viết một bản tuỳ bút, vẽ một dấu chấm tròn hoàn chỉnh cho câu chuyện thời thanh xuân của mình.\nDựa trên bản ghi chép từ câu chuyện có thật]\nMột câu giới thiệu đơn giản: A Vọng, tạm biệt.\nDàn ý: Kỷ niệm thanh xuân',
        isH: false,
        chapters: 1,
        tracks: [
            manual("Chương 1 (Hết)", "c1.m4a"),
        ]
    },
    {
        id: 15,
        folderName: "BongCucNho",
        title: "Bông Cúc Nhỏ",
        author: "Lạc Tâm",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/BongCucNho/cover.jpg",
        desc: 'Những bông cúc hoạ mi trắng mỏng, luôn tiêu biểu cho sự thanh cao trong veo...',
        isH: false,
        chapters: 5,
        tracks: [
            manual("Chương 1 - 5 (Hết)", "c1-5.m4a"),
        ]
    },
    {
        id: 16,
        folderName: "HaDenMangTheoThoTinh",
        title: "Hạ Đến Mang Theo Thơ Tình",
        author: "Thanh Chúc Kỉ Hứa",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/HaDenMangTheoThoTinh/cover.jpg",
        desc: 'THỂ LOẠI: Hiện đại, Tình chị em, Duyên trời tác hợp, Chức nghiệp tinh anh, Phi song khiết (Nam xử – Nữ phi), 1v1, HE\n\nVăn án:\nTần Thi 26 tuổi, tháo chạy khỏi cuộc hôn nhân đầy bạo lực lạnh.\nNgày thứ hai sau khi ly hôn, Tần Thi ném đơn xin nghỉ việc vào mặt sếp, mua vé máy bay đi du lịch.\nCô tìm lại những chiếc váy từ vài năm trước, ghé tiệm cắt tóc cắt một mái tóc ngắn.\nChẳng phải chỉ là người tình mới thôi sao? Ngày trước cô chỉ cần ra ngoài dạo một vòng là có thể gặp cả tá.\nTrên đường ra sân bay, cô bắt một chuyến xe đi chung, ghế phụ có một người đàn ông trẻ tuổi mặc sơ mi trắng đang ngồi.\nCô đứng bên cửa sổ phía anh nói chuyện với tài xế, mùi nước hoa hoa lan trong đêm khuya cứ thế xộc vào mũi anh…\n“Vì chị, địa ngục tôi cũng đến.”\n\n#Tình Chị Em #Mùa Xuân Thứ Hai\n\nLưu ý trước khi đọc:\nNữ chính không còn nguyên vẹn (không dành cho độc giả cực đoan về sự thuần khiết).\nTình chị em, chênh lệch 6 tuổi.',
        isH: false,
        chapters: 16,
        tracks: [
            manual("Chương 1 - 16 (Hết)", "c1-16.m4a"),
        ]
    },
    {
        id: 17,
        folderName: "ChanhMatOng",
        title: "Chanh Mật Ong [Đang update 45/dự kiến 60 chương]",
        author: "Trà Hoa Đậu Biếc",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/ChanhMatOng/cover.png",
        desc: 'Thể loại: Học đường, lãng mạn, hài hước, truyện teen.\nSố chương (dự kiến): 60 chương (chưa tính ngoại truyện)\n\nLưu ý:\n- Chanh Mật Ong lấy bối cảnh trường học ở Hải Phòng.\n- Truyện được viết lại hoàn toàn. Thiết lập nhân vật và cốt truyện không thay đổi, tôi chỉ bổ sung hoặc khai thác thêm nhân vật, tình tiết để truyện hoàn thiện và logic hơn.\n- Có yếu tố LGBTQ+.\n- Bản trên web có chửi thề (nhưng sẽ censor và tiết chế hơn).\n- Tính tôi cợt nhả và đây là truyện hài nên Chanh Mật Ong không phù hợp cho người nghiêm túc.\n- Giới hạn độ tuổi: 15+.\n- Hãy bình luận nhiều vào nhé! Hãy bình luận nhiều vào nhé! Hãy bình luận nhiều vào nhé! (Chuyện quan trọng phải nói 3 lần, tôi siêu thích đọc bình luận).\n- Anh em có thắc mắc hay ý kiến đóng góp gì, hãy bình luận trực tiếp hoặc nhắn về Fanpage Trà Hoa Đậu Biếc.',
        isH: false,
        chapters: 60,
        tracks: [
            manual("Chương 0 - 10", "c0-10.m4a"),
            ...batch(11, 40, 10, 'm4a'),
            manual("Chương 41 - 45", "c41-45.m4a"),
        ]
    },
    {
        id: 18,
        folderName: "YeuChangQuanNhanDangGhet",
        title: "Yêu Chàng Quân Nhân Đáng Ghét",
        author: "Thiền Tâm Nguyệt",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/YeuChangQuanNhanDangGhet/cover.jpg",
        desc: 'Sống lại một lần nữa, Mục Ảnh Sanh nghĩ thầm, thật là tốt. Thoát khỏi những uất ức ở kiếp trước, kiếp này cô có thể làm lại từ đầu. Đấu trí với người nhà, đăng kí vào trường quân đội trở thành bộ đội đặc chủng. Có thể hoàn thành ước mơ trở thành quân nhân.\nThế nhưng khi gặp lại kẻ không đội trời chung từ kiếp trước, cô vẫn tức giận đến nghiến răng kèn kẹt.\nLà anh kiếp trước luôn đối nghịch với tôi, là anh kiếp trước luôn ngáng đường tôi đi. Lần này tôi biết trước được tương lai, xem tôi đối phó với anh thế nào.\nChẳng qua cô đột nhiên lại phát hiện, người đàn ông ở trước mặt này phong thái hình như có vẻ gì đó là lạ.\nChàng trai anh tuấn đĩnh đạc từng bước tiến tới gần, cô bị anh áp sát lui về phía sau.\n“Việc thăng cấp thuộc về em. Yên tâm, sẽ không ai tranh với em.”\n“Anh có ý gì?” Người đàn ông cười rộ lên để lộ hàm răng trắng, cô lại cảm thấy lỗ chân lông mình dựng đứng lên. Có quỷ mới tin anh ta tự nhiên lại tốt bụng như vậy.\n“Không có ý gì.” Người đàn ông tiến về phía trước, dồn cô áp vào góc tường, ánh mắt thâm thúy tràn ngập vẻ chiếm hữu: “Cấp bậc thuộc về em, em thuộc về anh.”',
        isH: false,
        chapters: 771,
        tracks: [
            ...batch(1, 20, 10, 'm4a'),
            manual("Chương 21 - 25", "c21-25.m4a"),
            manual("Chương 26", "c26.m4a"),
            manual("Chương 27 - 30", "c27-30.m4a"),
            ...batch(31, 40, 5, 'm4a'),
            ...batch(41, 140, 10, 'm4a'),
            ...batch(141, 600, 5, 'm4a'),
            ...batch(601, 650, 10, 'm4a'),
            ...batch(651, 660, 5, 'm4a'),
            ...batch(661, 760, 10, 'm4a'),
            manual("Chương 761 - 771 (Hết)", "c761-771.m4a"),
        ]
    },
    {
        id: 19,
        folderName: "DaChanhTuyet",
        title: "Đá Chanh Tuyết",
        author: "Má Bánh Bao",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/DaChanhTuyet/cover.png",
        desc: 'Văn án:\nTôi khẽ chớp mắt, trái tim cũng theo đó rung lên từng hồi. Huy Anh chợt tiến lại gần tôi, mang theo mùi hương gì đó chẳng thể diễn tả bằng lời.\nCó lẽ do hương men nồng say của rượu, hoặc cũng có thể do sâu thẳm trong cõi lòng đơn độc đã bị đánh thức bởi thứ tình cảm khó nói, Huy Anh bỗng nhiên gục xuống hõm vai tôi. Nó chẳng chê hõm vai ấy gầy gò, hay xấu xí mà chỉ nhẹ nhàng ôm lấy người tôi. Chất giọng trầm khàn của kẻ trước mặt cứ như gió xuân thổi nhẹ bên tai, nó nỉ non bên vành tai đỏ ửng của tôi:\n- Trịnh Hữu Huy Anh suy em đến thế đấy!\nLại thế nữa rồi, tôi cố gắng trấn tĩnh đầu óc mình: yêu ai cũng được, ngoại trừ Trịnh Hữu Huy Anh.\n\nĐá Chanh Tuyết nằm trong chuỗi truyện "Em và Bảo Lộc".\nLưu ý: Truyện còn nhiều thiếu sót, nhân vật chưa hoàn thiện. Rất mong nhận được góp ý từ độc giả để tác giả có thể cải thiện và rút kinh nghiệm cho những tác phẩm sau. Xin chân thành cảm ơn ạ.',
        isH: false,
        chapters: 75,
        tracks: [
            ...batch(1, 60, 10, 'm4a'),
            manual("Chương 61 - 67 (Hoàn chính văn)", "c61-67.m4a"),
            manual("Ngoại truyện (Hết)", "nt.m4a"),
        ]
    },
    {
        id: 20,
        folderName: "DungLiaCanh",
        title: "Đừng Lìa Cành",
        author: "Song Tiền Thụ",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/DungLiaCanh/cover.png",
        desc: 'Hoá ra trong vô vàn khoảnh khắc chúng ta không để ý, tình yêu đã lặng lẽ tới từ lâu rồi',
        isH: false,
        chapters: 26,
        tracks: [
            ...batch(1, 26, 13, 'm4a'),
        ]
    },
    {
        id: 21,
        folderName: "DauTayDuongPhen",
        title: "Dâu Tây Đường Phèn",
        author: "Má Bánh Bao",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/DauTayDuongPhen/cover.png",
        desc: 'Thanh xuân của tôi có cậu. Thanh xuân của cậu cũng có tôi...\nMình từng rất ghét một người chỉ đơn giản vì cậu ấy học giỏi hơn mình. Nhưng dần dần mình mới phát hiện thích một người là muốn cùng người đó cố gắng để chạm đến những ước mơ tươi đẹp trong tương lai. Mình cùng cậu ấy trải qua thanh xuân ngọt ngào với những ngày thi cử đầy áp lực, những trận cãi nhau đến nỗi òa khóc, những tiếng cười rộn ràng trong chiều nắng mùa xuân, những buổi học văng vẳng tiếng giảng bài của thầy cô trong tiết hè oi bức, hay cái ôm trên chiếc xe đạp dưới trời thu xanh ngắt tầng mây và cả nụ hôn đầu dưới gió đông se se lạnh.\nKhả Hân và Nhật Hưng năm ấy đã vẽ lên mối tình trong trẻo nhất, ngọt ngào nhất dưới mái trường chuyên ấy ...\nP/s: truyện lần đầu mình viết, truyện lấy cảm hứng từ những trải nghiệm ở mái trường chuyên cấp ba của mình, có hơi teenfic, hơi xàm xàm nhưng hãy ủng hộ mình nha.',
        isH: false,
        chapters: 64,
        tracks: [
            ...batch(1, 60, 20, 'm4a'),
            manual("Chương 61 - 63 + Ngoại truyện (Hết)", "c61-63+NT.m4a"),
        ]
    },
    {
        id: 22,
        folderName: "CachPhaHuyHocSinhHeChuyen",
        title: "Cách Phá Huỷ Học Sinh Hệ Chuyên",
        author: "Trang Quỳnh",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/CachPhaHuyHocSinhHeChuyen/cover.png",
        desc: 'Vì một "sai lầm nghiêm trọng", Phạm Trúc Song buộc phải chuyển trường.\nKhông ngờ rằng tại ngôi trường mới, Phạm Trúc Song gặp lại kỳ phùng địch thủ năm nào - Nguyễn Hoàng Khải An.\nPhạm Trúc Song xem Nguyễn Hoàng Khải An là đối thủ không đội trời chung, nhưng Phạm Trúc Song lầm tưởng rồi.\nSự thực là đối thủ đội chung một đời.',
        isH: false,
        chapters: 32,
        tracks: [
            manual("Chương 1 - 15", "c1-15.m4a"),
            manual("Chương 16 - 32 (1)", "c16-32 (1).m4a"),
            manual("Chương 16 - 32 (2) - (Hết)", "c16-32 (2).m4a")
        ]
    },
    {
        id: 23,
        folderName: "HanhLangHaiLop",
        title: "Hành Lang Hai Lớp",
        author: "Hoa Cỏ",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/HanhLangHaiLop/cover.png",
        desc: 'Ai cũng biết A1 và A2 choảng nhau như chó với mèo, tính toán với nhau từng xen-ti-mét đoạn hành lang với chiếc ghế đá ở giữa ngay từ ngày đầu tiên vào cấp ba. Ngày nắng hay mưa đều ngang ngược gây nhau.\nNhưng chuyện ngang ngược hơn mà đám trẻ không nghĩ tới là cán bộ lớp hai bên yêu đương, là cái kiểu “tình trong như đã mặt ngoài cũng chẳng thèm e”, thản nhiên nhuộm không khí thành màu hồng bling bling mỗi lần đi cùng nhau.\nTừ chiếc ghế đá gây nên thù nhỏ, dẫn tới thù lớn rồi đến n chuyện phát sinh dở khóc dở cười giữa những cô cậu mới lớn. Những tâm tình khó hiểu khó chiều khiến dãy hành lang ngắn ngủn một ngày cũng không được yên tĩnh.\nViệt Chinh ngây ngô với cái nhìn thế giới này toàn nhuộm màu rực rỡ tựa hàng trăm con hạc giấy Đỗ Thành Trí tự tay gấp tặng mình, hứa hẹn đây là vật định tình chứng minh một mối tình nghiêm túc. Lẫn lộn trong những mảng màu tươi sáng ấy Việt Chinh bắt gặp vệt xám xịt bên trong những người bạn của mình, cái Tâm đỏ hoe hỏi Việt Chinh:\n“Bạn có nghe thấy tiếng hoa nở không? Khi lòng chúng ta thật sự yên bình ấy.”\nViệt Chinh không hiểu tiếng hoa nở là ý gì.\nHành lang hai lớp, vài ba chuyện tình cảm buồn cười dở hơi của bọn trẻ và hành trình tìm kiếm âm thanh hoa nở của những tâm hồn không an yên.',
        isH: false,
        chapters: 52,
        tracks: [
            ...batch(1, 30, 10, 'm4a'),
            manual("Chương 31 - 40 (1)", "c31-40 (1).m4a"),
            manual("Chương 31 - 40 (2)", "c31-40 (2).m4a"),
            manual("Chương 41 - 50 (1)", "c41-50 (1).m4a"),
            manual("Chương 41 - 50 (2)", "c41-50 (2).m4a"),
            manual("Ngoại truyện (Hết)", "nt.m4a"),
        ]
    },
    {
        id: 24,
        folderName: "101CachVietThuTinhTangLopTruong",
        title: "101 Cách Viết Thư Tình Tán(g) Lớp Trưởng",
        author: "Đại Bông",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/101CachVietThuTinhTangLopTruong/cover.png",
        desc: 'Làm sao để viết một bức thư tình thật thuyết phục?\nDiệp chợt nhớ ra khi đi thi Văn nó hay dùng cách viết một ý nhiều lần để được nhiều điểm hơn. Giờ chưa biết viết gì thì cứ ghi một ý vài lần để bày tỏ thành ý chắc cũng được.\n"Hoàng Nhật Đăng, mình thích cậu mình thích cậu mình thích cậu mình thích cậu mình thích cậu mình thích cậu mình thích cậu mình thích cậu mình thích cậu mình thích cậu mình thích cậu mình thích cậu mình thích cậu."\nThấy bức thư xong, Đăng đóng sách cái "bép" rồi đập bàn đứng dậy hỏi cả lớp:\n"Đứa nào nguyền rủa tao đấy?"',
        isH: false,
        chapters: 50,
        tracks: [
            manual("Chương 1 - 10", "c1-10.m4a"),
            ...batch(11, 50, 5, 'm4a'),
            manual("Ngoại truyện (Hết)", "nt.m4a"),
        ]
    },
    {
        id: 25,
        folderName: "LinhChiNguYen",
        title: "Linh Chi Ngủ Yên",
        author: "Đại Bông",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/LinhChiNguYen/cover.png",
        desc: 'Một cô gái mồ côi sống lặng lẽ cô độc, ngày ngày liều mạng kiếm tiền để rồi phát hiện mình bị bệnh nan y sắp chết. Ngay khi quyết định sẽ vung tiền để trải nghiệm những điều mình chưa kịp làm khi còn sống, cô vô tình cứu được một anh chàng đẹp trai bị truy giết ngoài đường.\nSau đó cô chợt nhớ ra trong danh sách đầu mục những việc muốn thử trước khi chết có bao gồm ABCXYZBSVSHRJWIOSKFKEOOE với trai đẹp...',
        isH: false,
        chapters: 56,
        tracks: [
            ...batch(1, 50, 5, 'm4a'),
            manual("Chương 51 - 56 (Hết)", "c51-56.m4a"),
        ]
    },
    {
        id: 26,
        folderName: "XanhXanhGocTroi",
        title: "Xanh Xanh Góc Trời",
        author: "Lê Minh",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/XanhXanhGocTroi/cover.png",
        desc: 'Giữa cuộc đời chảy trôi theo từng bước chân, giữa tháng năm thấm thoát chẳng thể nào quay lại, vẫn còn một mảnh trời xanh nơi ngôi trường ngày ấy đã chứng kiến bao khoảnh khắc vụng dại của những cô cậu học trò.\nXoay quanh câu chuyện về Lam, Minh, Chi, Khánh, “Xanh xanh góc trời” kể về thời cấp ba với muôn vàn những trải nghiệm đầu đời của từng nhân vật. Đứng trước các lựa chọn và ngã rẽ, mỗi người lại mang trong lòng những nỗi niềm khác nhau.\nTất cả tạo nên một quãng thời gian mà ở đó, dẫu có là hân hoan hay vụn vỡ, chia biệt hay vẹn nguyên, thì tháng năm nhìn lại, tất thảy rồi cũng chỉ còn trong hình hài của những hoài niệm bâng khuâng.',
        isH: false,
        chapters: 29,
        tracks: [
            ...batch(1, 20, 10, 'm4a'),
            manual("Chương 21 - 29 (Hết)", "c21-29.m4a"),
        ]
    },
    {
        id: 27,
        folderName: "QuaDoiDiuDang",
        title: "Quá Đỗi Dịu Dàng",
        author: "Điềm Thụy",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/QuaDoiDiuDang/cover.png",
        desc: 'Minh Nhật là một đứa kiêu ngạo, nhưng vì quá thích cô ấy. Cậu đã...\nTìm mọi cách bắt chuyện.\nGiả làm Grab đón đưa.\nHướng dẫn cô ấy học Toán.\nTrộm nhìn cô ấy rồi dùng 7749 lý do biện minh.\nNhưng cô ấy không hiểu lắm, cô ấy nghĩ cậu và cô ấy thật sự là bạn.',
        isH: false,
        chapters: 70,
        tracks: [
            ...batch(1, 65, 5, 'm4a'),
            manual("Chương 66 - 69 + Ngoại truyện (Hết)", "c66-69+NT.m4a"),
        ]
    },
];