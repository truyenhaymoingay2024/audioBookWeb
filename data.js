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
        folderName: "ChinhPhucDoiThuDenNghien",
        title: "Chinh Phục Đối Thủ Đến Nghiện",
        author: "A Sấu A",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/ChinhPhucDoiThuDenNghien/cover.jpg",
        desc: "Hai người có tiếng cả đời không qua lại với nhau, không chỉ là cạnh tranh trong việc học hành mà còn nhìn đối phương không vừa mắt.\nNhưng không ai biết, trong âm thầm, bọn họ thường xuyên ra vào Như Gia thuê phòng bắn pháo.\nLục Hoài Chuẩn: Bạn gái người khác ở trên giường đều là xoắn xuýt lấy dương vật của bạn trai, lẳng lơ hăng say kêu: “A, dương vật của chồng lớn quá, làm người ta thật sướng.”\nBạn gái của tôi lại không giống vậy, cô ấy ở trên người tôi vặn vẹo hăng say và hỏi: “Đáp án đề tự luận cuối cùng trong bài thi toán học của anh là gì?”",
	    isH: true,
        chapters: 70,
        tracks: [
            tr(1, 20, 1), tr(1, 20, 2),
            tr(21, 40, 1), tr(21, 40, 2),
            tr(41, 60, 1), tr(41, 60, 2),
            tr(61, 70, null, 'Hết')
        ]
    },
    {
        id: 2,
        folderName: "MatCaVaChauNgoc",
        title: "Mắt Cá Và Châu Ngọc",
        author: "Tể Lệ Liệp Thủ",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/MatCaVaChauNgoc/cover.jpg",
        desc: "Hàn Trân và Quý Đình Tông là người thuộc hai tầng lớp khác nhau.\nLần đầu gặp anh, cô là người vợ bình phong vừa thoát khỏi một cuộc hôn nhân lừa dối, trong tình cảnh thảm hại, cô vô tình chọc vào nhân vật quyền cao chức trọng này.\nThế rồi mới vỡ lẽ, anh không phải một vị Phật vô dục vô cầu, mà là một con quỷ đắm chìm trong bể dục.\n\n(Thư ký trưởng Tỉnh ủy và Người dẫn chương trình, nam hơn nữ 15 tuổi)",
	    isH: true,
        chapters: 100,
        tracks: [
            tr(1, 20, 1), tr(1, 20, 2),
            tr(21, 40),
            tr(41, 60, 1), tr(41, 60, 2),
            tr(61, 80, 1), tr(61, 80, 2),
            tr(81, 100, 1), tr(81, 100, 2, 'Hết') // Note: Data cũ file 2 là c81-100 (2).mp3
        ]
    },
    {
        id: 3,
        folderName: "VanNe",
        title: "Vân Nê",
        author: "Thanh Đăng",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/VanNe/cover.jpg",
        desc: "Trần Kiều chưa từng nghĩ sẽ có một ngày ác ma vươn nanh vuốt về phía cô... Bị lừa, bị bắt cóc, bị bán, bị đưa vào núi sâu, ở một nơi mà cô có dùng cả đời cũng không thể thoát được. Người đàn ông kia bức bách cô, giam cầm cô, mỗi đêm đều lăn lộn khiến cô sống không bằng chết. Trần Kiều nghĩ, dù có phải chết, cô cũng phải chạy thoát khỏi nơi quái quỷ này...\nLý Tồn Căn yêu chết người vợ nhỏ mà anh mua về, anh đào tim, đào phổi, thương cô sủng cô, cũng không có cách nào đổi lấy một nụ cười của cô. Chỉ khi dùng hết sức lực 'muốn' Trần Kiều, anh mới có thể nhìn thấy được một chút diễm lệ từ cô.\nLý Tồn Căn đỏ mắt, bóp chặt eo cô, “A Kiều, chúng ta phải bên nhau, cả đời.” Cô cắn răng ức chế rên rỉ, “Mơ đi!”\n\nLời tác giả:\n[ thương sủng, nam soái nữ mỹ, có cưỡng bức! ]\n[ đừng bị văn án dọa, nam chính là liếm cẩu, liếm đến cuối cùng, cần cái gì có cái đó! ]",
	    isH: true,
        chapters: 76,
        tracks: [
            tr(1, 20, 1), tr(1, 20, 2),
            tr(21, 40, 1), tr(21, 40, 2),
            tr(41, 60, 1), tr(41, 60, 2),
            tr(61, 76, 1), tr(61, 76, 2), tr(61, 76, 3, 'Hết')
        ]
    },
    {
        id: 4,
        folderName: "LucDuThanhMenDuTich",
        title: "Lục Dư Thành Mến Du Tích",
        author: "Bàn Bàn Quất",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/LucDuThanhMenDuTich/cover.jpg",
        desc: "Thiếu nữ đáng yêu vẻ ngoài ngoan ngoãn x học trưởng tiêu chuẩn vừa ngầu vừa manh\n\n“Anh có thể làm bạn giường cả đời của em, nhưng cũng muốn đeo nhẫn cho em cùng em đi hết quãng đời còn lại.”\n“Là tự em đến đây, vậy tại sao tôi phải buông tha để em đi?”\n“Hắn muốn nghe cô rên rỉ, muốn nghe cô cầu xin hắn, muốn nghe cô khóc dưới thân mình…”\n\nĐoạn ngắn 1:\nDu Tích vặn vẹo: “Anh là biến thái sao? Mua nhiều quần áo kỳ quái như vậy làm gì? Anh có phải đã lên kế hoạch từ lâu rồi hay không!”\n“Đúng vậy.” Lục Dư Thành vuốt ve một cái quần lót nhỏ trong suốt: “Muốn cùng em làm tình trong khi mặc những bộ đồ này. Mặc đồng phục, cột dây trói lại, mặc đến nửa kín nửa hở, đều muốn hết.”\n\nĐoạn ngắn 2:\nTay Du Tích chống lên khuôn ngực của người đàn ông: “Tôm hùm đất…. Em muốn ăn tôm hùm đất….” Cô đáng thương nhìn Lục Dư Thành: “Em đói quá.”\nLục Dư Thành bóp lấy bầu ngực đầy đặn của thiếu nữ, lưu manh nói: “Em no.”",
	    isH: true,
        chapters: 18,
        tracks: [
            tr(1, 18, null, "Hết")
        ]
    },
    {
        id: 5,
        folderName: "HeThongSungPhi",
        title: "Hệ Thống: Sủng Phi Biết Làm Nũng Tốt Số Nhất",
        author: "Tương Tư Phong Tử Thái Tử Phi",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/HeThongSungPhi/cover.jpg",
        desc: "Gia Ý phúc mỏng, Tạ Yến ơn trạch, rất tương xứng\n\nNữ chủ trọng sinh thân kiều thể nhược vì tồn tại, trăm phương nghìn kế làm nũng bán si tích cóp ân sủng của đế vương để kéo dài phúc trạch.\n---------------\nNữ chủ: tích cóp tích cóp tích cóp\nNam chủ: sủng sủng sủng",
	    isH: true,
        chapters: 158,
        tracks: [
            ...batch(1, 140, 10), 
            tr(141, 153, null, "Hoàn chính văn"),
            manual("Ngoại truyện (Hết)", "nt1-5.mp3")
        ]
    },
    {
        id: 6,
        folderName: "AnhDenHoaLe",
        title: "Ánh Đèn Hoa Lệ",
        author: "Phất Hà Lão Yêu",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/AnhDenHoaLe/cover.jpg",
        desc: "Ở một góc phố đèn đỏ tại Vũ Hán có một tiệm trang điểm tên Trân Trân, chủ tiệm Giang Ánh Nghê tuy dữ dằn nhưng lại có tay nghề rất đỉnh.\nVào sinh nhật 19 tuổi, Giang Ánh Nghê tới trường lái ghi danh.\n“Học số sàn hay số tự động?”\nNgười đàn ông ngước lên nhìn cô gái trẻ trang điểm rất đậm: “Đã thành niên chưa?”\n“19.”\nGiang Ánh Nghê đặt thẻ căn cước công dân của mình lên bài đánh “rầm” một tiếng, lạnh lùng nhìn người đàn ông kia, mới hay ông chú này chính là một vị khách quen của khu phố đèn đỏ...\n“Số sàn 3000 tệ, bao dạy ba năm.” Rồi anh ta tỉnh bơ nói: “Trả bằng quét mã Alipay hoặc Wechat.”\n“Bớt chút được không?” Thái độ của cô rất đỗi ngang ngược.\n“Không được.” Anh lại liếc nhìn cô, “Về nhà bàn bạc với bố mẹ đi, xong hẵng tới ghi danh.”\n“Em không có bố mẹ.”\nGiang Ánh Nghê thôi trả giá, vừa quét mã trả tiền vừa hỏi: “Thực hành ai dạy thế?”\n“Em muốn ai dạy?” Anh nói: “Chỗ tôi có sáu giáo viên.”\nCô đáp: “Em muốn anh.”\nAnh nhướng mày, “Tôi là ông chủ, lười dạy lắm.”\n“Anh có dạy không thì bảo?” Giang Ánh Nghê hất cằm hỏi.\nAnh phì cười: “Có thể cân nhắc.”",
	    isH: true,
        chapters: 47,
        tracks: [
            ...batch(1, 40, 5), 
            tr(41, 47, null, "Hết")
        ]
    },
    {
        id: 7,
        folderName: "DinhCapTenConDo",
        title: "Đỉnh Cấp Tên Côn Đồ (tác giả tạm drop)",
        author: "Chu Phù Yêu",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/DinhCapTenConDo/cover.jpg",
        desc: "Trong một buổi chiều nóng nực. \nChu Hạ Hạ vừa đi học về, cô nhìn thấy một người đàn ông đang đi xuống cầu thang. \nAnh ta rất cao, chân dài, lại cực kì đẹp trai. \nCô lại cảm thấy vô cùng quen mắt, ngập ngừng rồi gọi: “Chú út?”\nChu Dần Khôn đang xắn tay áo che lại vết máu thì nghe thấy ai đó gọi, anh lười biếng nhìn qua. \nỒ, là một cô bé. \nTừ khi nào mà con bé đã lớn như vậy rồi nhỉ?",
	    isH: true,
        chapters: 372,
        tracks: [
            ...batch(1, 200, 10),
            ...batch(201, 365, 5),
            tr(366, 372)            
        ]
    },
    {
        id: 8,
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
        id: 9,
        folderName: "MuonGiong",
        title: "Mượn Giống 1v1",
        author: "Oản Đậu Giáp",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/MuonGiong/cover.jpg",
        desc: "Giới thiệu 1: Vì để thuận lợi kế thừa gia nghiệp, Chu Hạo Cường phát hiện mình không có khả năng sinh đẻ nên đã cố nhịn đưa người vợ yêu quý Tô Đường của mình cho anh trai mình để lấy hạt giống của Chu Sở Thần, người mang dòng máu của nhà họ Chu để sinh ra một đứa con của nhà họ Chu. Tuy nhiên, anh ta đã không ngờ đến đây chỉ là cái bẫy do người khác giăng ra!\n\nGiới thiệu 2: Tô Đường bị người chồng không có khả năng sinh đẻ uy hiếp. Lén lút bò lên giường của anh trai, mượn giống để mang thai. Lần đầu tiên làm loại chuyện này rất do dự, đang muốn từ bỏ trốn chạy lại bị người đàn ông vốn đang bị cho uống thuốc mê ngủ say trên giường đột nhiên xoay người dậy, cơ thể nặng nề đè cô xuống dưới. Hơi thở nóng rực phả tới, giọng nói khàn khàn gọi cô: “Đường Đường, muốn chạy đi đâu?”\n\nTránh mìn: Nữ phi nam xử.",
	    isH: true,
        chapters: 295,
        tracks: [
            ...batch(1, 150, 5),
            ...batch(151, 250, 10),
            tr(251, 257, null, "Hoàn chính văn"),
            manual("Phiên ngoại 1 - 10", "c258-267.mp3"),
            manual("Phiên ngoại 11 - 20", "c268-277.mp3"),
            manual("Phiên ngoại 20 - 30", "c278-287.mp3"),
            manual("Phiên ngoại 31 - 38 (Hết)", "c288-295.mp3")
        ]
    },
    {
        id: 10,
        folderName: "CaCuoc",
        title: "Cá Cược",
        author: "Mộc Khẩu Ngân",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/CaCuoc/cover.jpg",
        desc: "Lâm Hỉ Triều và Kha Dục vốn là hai cá nhân chẳng có tí liên quan gì với nhau trong trường học.\nCậu là tên công tử nhà giàu nổi loạn, còn cô lại là một học sinh gương mẫu vô danh.\nThế nhưng, sau lưng mọi người, hai người họ luôn tiến hành những cuộc cá cược dựa trên giao dịch thể xác từ nhỏ đến lớn.\nThách cậu giải bài toán đó trong vòng mười phút.\nTôi muốn nụ hôn đầu của cậu.\nĐố cậu buổi tự học tối nay toàn trường có bị mất điện không?\nTôi muốn cậu cởi hết đồ.\nCái thằng hay chuyện với cậu đang thích cậu đúng không?\nTôi muốn cậu, làm tình với tôi, ngay trước mặt nó.",
	    isH: true,
        chapters: 102,
        tracks: [
            ...batch(1, 90, 5),
            manual("Chương 91 - 96 (Hoàn chính văn)", "c91-96.mp3"),
            manual("Ngoại truyện (Hết)", "nt1-6.mp3")
        ]
    },
    {
        id: 11,
        folderName: "NuPhuTraXanhTroThanhDoChoiCuaNamChinh",
        title: "Nữ Phụ Trà Xanh Trở Thành Đồ Chơi Của Nam Chính",
        author: "Miên Nhuyễn Nhuyễn",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/NuPhuTraXanhTroThanhDoChoiCuaNamChinh/cover.jpg",
        desc: "Một câu chuyện khác của nguyên tác “Sau khi bị vả mặt, nữ phụ trèo lên người nam chính (H)”, không còn những tình tiết xuyên sách, đi theo con đường hiện thực tối tăm, tuyến đường cưỡng chế yêu, nhiều H, ngọt ngào.\n\nNữ phụ trà xanh từng bước gặp khó khăn X nam chính không hề che giấu sự ác liệt của mình mà dạo chơi nhân gian.\n\nCô gái đáng thương sinh ra trong gia đình bình thường bị thiếu gia nhà giàu đùa bỡn, thời gian đầu chỉ thích làm tình không thích yêu đương.\n\n“Trà xanh bạch liên”, “tiểu tam”, “tâm cơ”, “quyến rũ Nghiêm Kỷ” đây là những nhãn dán của Mộc Trạch Tê, luôn khiến người ta khinh thường.\n“Học sinh ba tốt”, “nghiêm túc đứng đắn”, “ thân thiện với mọi người “, “dịu dàng” đây là những nhãn dán của Nghiêm Kỷ, được người người khen ngợi.\n\nTừ nhỏ, Mộc Trạch Tê đã có người mẹ luôn mang vọng tưởng bám víu vào những gia đình quyền quý, đương nhiên cô cũng bị dính vào kế hoạch ấy.\nĐể tiếp cận Nghiêm Kỷ, cô dùng đủ mọi cách, thậm chí còn làm khó Lâm Thi Vũ, người tự nhiên thân thiết với Nghiêm Kỷ.\nTất cả những gì cô nhận được cũng chỉ là sự hờ hững và xa cách của Nghiêm Kỷ.\nMộc Trạch Tê từ bỏ...\nDưới lớp ngụy trang của mình, Nghiêm Kỷ là một kẻ vô cùng độc ác. Thái độ của anh với mọi thứ như thần linh dạo chơi nhân gian, sau đó lại nhận ra bản thân mình là kẻ xấu xa, thích làm việc ác nhưng không muốn mình bị mọi người chế nhạo.\nAnh thích kiểm soát và theo đuổi những thứ kích thích.\nKhi phát hiện ra người vẫn luôn theo đuổi mình từ khi còn nhỏ - Mộc Trạch Tê, muốn chạy sang vòng tay của kẻ khác, anh phát điên lên. Sau khi ăn sạch người ta vào miệng, anh ăn tủy biết vị [1] phát hiện niềm vui sướng mỗi khi đùa bỡn Mộc Trạch Tê.\nMộc Trạch Tê vẫn luôn dựa vào dáng người của mình để quyến rũ được Nghiêm Kỷ, giúp mẹ cô có thể từng bước tiến vào nhà họ Nghiêm giàu sang, quyền thế.\nNhưng chỉ có mình Mộc Trạch Tê biết được, đằng sau nét cười ôn hòa là sự u tối chỉ biết làm tình của anh.\nĐây là câu chuyện nguyên bản của “Sau khi bị vả mặt nữ phụ trèo cao có được nam chính (H)”.\nLà một câu chuyện thể hiện ý chí của một người phụ nữ chỉ có nhan sắc nhưng lại muốn leo lên một gia đình giàu có, lấy nhan sắc để phục vụ dục vọng của người khác. (Hai người có tình cảm, nhưng không cản trở nam chính ham mê nữ sắc, vẫn chóa lắm).\nNếu không thích, thì nhanh chạy!.\nBởi vì là một câu chuyện khác nên sẽ có cảnh mới, cũng sẽ có một số cảnh và văn bản là trong “Nữ phụ vả mặt”. Chuyện nguyên bản, cùng một cảnh tượng nhưng câu chuyện khác nhau.\nTính cách của nhân vật cơ bản không thay đổi, nhưng nội dung cốt truyện sẽ đi theo hướng khác.",
	    isH: true,
        chapters: 64,
        tracks: [
            ...batch(1, 60, 5, 'm4a'),
            tr(61, 64, null, 'Hết', 'm4a')
        ]
    },
    {
        id: 12,
        folderName: "BoiDem",
        title: "Bơi Đêm",
        author: "Dã Bồ Tát",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/BoiDem/cover.jpg",
        desc: "Hồ Già luôn cảm thấy Điền Tư có một cuộc sống tốt đẹp hơn cô, anh không cần phải treo cổ trên cái cây mục nát là cô đây.\nCho đến một ngày, cô mở ngăn kéo của anh và phát hiện ra rằng ngoài những đồ chơi tình dục mà họ thường dùng, còn có cả Snoth và Sertraline, cái trước là thuốc ngủ, cái sau là thuốc chống trầm cảm được giấu kín.\nSau đó, câu chuyện của họ đã thay đổi.\n🪷 Bông hoa trên cao bị kéo xuống khỏi bệ thờ\nSau đó anh trở thành một chú chó nhỏ dính người 🐶\n🍑 Nữ chính điên cuồng, xinh đẹp Vs 🐴 Nam chính dịu dàng, ẩn nhẫn, dính người\n🌊 Trước khi trưởng thành, những tháng ngày ấy với họ là một cuộc bơi đêm, họ phải nín thở, nỗ lực bơi về phía trước.\n✨ Hai bên cứu rỗi lấy nhau.\n⚡️Nam chính là trai tân, nữ chính không phải, kết cục HE\n💦 Có yếu tố câu dẫn và dirty talk, nữ chính rất thích trêu chọc nam chính\n🌚 Nam chính sau khi thích nữ chính có chút ẩn nhẫn mà cuồng tình",
	    isH: true,
        chapters: 178,
        tracks: [
            ...batch(1, 175, 5, 'm4a'),
            manual("Chương 176 - 177 (Hoàn chính văn)", "c176-177.m4a"),
            manual("Ngoại truyện (Hết)", "nt.m4a")
        ]
    },
    {
        id: 13,
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
        id: 14,
        folderName: "ChomThu",
        title: "Chớm Thu",
        author: "Bạch Mao Phù Lục",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/ChomThu/cover.jpg",
        desc: "Người ta nói rằng cụm từ “Lửa chảy tháng bảy” có nghĩa là vào tháng bảy âm lịch, tiết trời dần trở nên mát mẻ, lúc sập tối có thể nhìn thấy sao Hoả rơi xuống từ phía Tây.\nĐến tận khi mùa hạ qua đi, cái lạnh ùa đến.\nCảm giác kích thích khi rơi xuống với tốc độ cực nhanh này, hoàn toàn trùng khớp với nhịp đập rộn rã nơi tim cô vào giây phút đầu tiên chạm mắt với Trần Đạc.\n\n* Cuộc sống bình đạm hằng ngày, chậm nhiệt, không logic\n* Nội dung nhiều hơn thịt\n* Nam chính vẻ ngoài lãnh đạm nội tâm u ám, trên giường dần dần trở nên gợi tình.\n* Vừa gặp đã yêu, yêu cả một đời.\n“Cố thắp sáng những vì sao để chúng ta có thể gặp lại nhau vào mỗi tối.”",
	    isH: true,
        chapters: 54,
        tracks: [
            ...batch(1, 50, 5, 'm4a'),
            manual("Chương 51 - 54 (Hết)", "c51-54.m4a")
        ]
    },
    {
        id: 15,
        folderName: "DuSinh",
        title: "Dư Sinh",
        author: "Gia Bất Hối",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/DuSinh/cover.jpg",
        desc: "Cố Dư và Cố Thần Sinh gặp nhau trong một đêm Paris tuyết bay đầy trời. Tại nơi đất khách quê người ấy, hai con người là lần đầu tiên gặp nhau nhưng đã lấy đi của nhau biết bao thứ, trong đó có lẽ nhiều hơn là tình cảm. Một chàng trai trưởng thành, thành đạt trong cuộc sống và một cô gái tuổi thanh xuân 18 ngọt ngào. Khi ấy, hai người họ có lẽ đã có thể tiến xa hơn nhưng bất ngờ lại dừng lại ở đó.\n\nCố Dư là một cô gái xinh đẹp và thông minh. Cô biết mình nên đối diện với thực tại ra sao. Bởi vậy mà khi ấy, cô đã từ chối anh. Cữ ngỡ như chuyện tình của họ chỉ là câu chuyện tình một đêm nhưng duyên phận đã kéo họ lại với nhaumột lần nữa mặc dù đó là nghiệt duyên. Rào cản thân phậncó ngăn cách họ thì  tình cảm của họ thì vẫn luôn đong đầy. Mặc dù là anh em họ nhưng đó chỉ là thân phận trên danh nghĩa. Họ vẫn lấy lý do không cùng huyết thống để bao lấy tình yêu của cả hai. Thế nhưng, liệu đến cuối cùng, Dư – Sinh có thể hạnh phúc bên nhau?",
	    isH: true,
        chapters: 35,
        tracks: [
            ...batch(1, 30, 5, 'm4a'),
            manual("Chương 31 - 35 (Hết)", "c31-35.m4a")
        ]
    },
    {
        id: 16,
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
        id: 17,
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
        id: 18,
        folderName: "QuanQuytKhongRoi",
        title: "Quấn Quýt Không Rời",
        author: "Tô Mã Lệ",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/QuanQuytKhongRoi/cover.jpg",
        desc: 'Một nữ sinh cấp ba nhất thời lơ là cảnh giác bị bắt cóc lên một chiếc xe màu đen, từ đó bị kéo vào vực sâu vô tận.\nBên dưới vực sâu, có một bàn tay vươn ra hướng về phía cô.\nNgười nọ hỏi cô: "Nếu ngoan ngoãn nghe lời thì tôi sẽ cứu em ra, chịu không?"\nCô gật đầu.\nVà cô thật sự đã thoát khỏi vực sâu đó.\nNhưng người nọ lại như ác ma ở trong sinh mạng của cô, gắn bó như hình với bóng.\nToàn văn 1V1. Cao H.\n-"Thịnh Hạ, tôi chưa theo đuổi con gái bao giờ."\n-"Tôi cũng không biết dỗ dành con gái vui vẻ."\n-"Tôi biết, là tôi nuốt lời."\n-"Xin lỗi, dường như tôi...một khi chạm vào em... sẽ lập tức mất kiểm soát."',
	    isH: true,
        chapters: 99,
        tracks: [
            ...batch(1, 95, 5, 'm4a'),
            manual("Chương 96 - 99 (Hết)", "c96-99.m4a")
        ]
    },
    {
        id: 19,
        folderName: "ThamSo",
        title: "Thẩm Sơ",
        author: "Nhạc Viên Lộ",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/ThamSo/cover.jpg",
        desc: 'Khi còn nhỏ sinh sống ở hội sở, Thẩm Sơ đã bị nghiện tình dục nặng, trước khi bị đưa tới phòng bao lúc mười lăm tuổi, cô được cảnh sát Hứa Phóng lỡ tay cướp mất, rồi trở về nhà cùng anh.\nNgay từ giây phút đó, con đường cứu rỗi cô thiếu nữ nghiện tình dục của Hứa cảnh sát không đi không về, từ việc trị liệu bằng gậy mát xa đến cách tự an ủi, từ việc trị liệu ngậm tinh dịch đến cách đâm thẳng vào huyệt....\nDần dần trong quá trình trị liệu, Hứa cảnh sát không chỉ bực bội chia tay cô bạn gái của mình, mà còn bất tri bất giác nghiện cô thiếu nữ kia, ngược lại, sau này lỗ huyệt của thiếu nữ đó lại trở thành thứ thuốc trị liệu cho tính nghiện tình dục của Hứa cảnh sát.\nÁng văn này có tiết tấu hơi chậm, cảnh máu chó trước sau như một, không có tam quan, nam chính nữ chính trật bánh, chị em chú ý cẩn thận nhé!',
	    isH: true,
        chapters: 139,
        tracks: [
            ...batch(1, 120, 10, 'm4a'),
            manual("Chương 121 - 134 (Hoàn chính văn)", "c121-134.m4a"),
            manual("Ngoại truyện 1 - 5 (Hết)", "nt1-5.m4a")
        ]
    },
    {
        id: 20,
        folderName: "GiayBaLe",
        title: "Giày Ba Lê",
        author: "Ba Lôi Hài",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/GiayBaLe/cover.jpg",
        desc: 'LƯU Ý: BỘ TRUYỆN CÒN THIẾU 25 CHƯƠNG (TỪ 27-31, 81-98, 2 NGOẠI TRUYỆN), BẠN NÀO CÓ NGUỒN THÌ CHO MÌNH XIN NHÉ. MÌNH CẢM ƠN NHIỀU Ạ!\n\nCâu chuyện kể về một chàng trai nghèo thích thầm cô công chúa nhỏ nhiều năm.\nCô công chúa đứng trên đài cao tỏa sáng rực rỡ, cô không biết rằng ở trong góc tối có một chàng trai đã dõi theo cô rất lâu, rất lâu.\nChàng trai chỉ dám ngắm nhìn công chúa từ xa, bởi cậu biết cậu không xứng với công chúa hơn nữa công chúa đã có người mà mình thích. Chàng trai chỉ có thể âm thầm giữ lấy tình cảm đơn phương của mình, cho đến một ngày trời cao rủ lòng thương xót, an bài cho hai người gặp nhau...',
	    isH: true,
        chapters: 100,
        tracks: [
            ...batch(1, 20, 10, 'm4a'),
            manual("Chương 21 - 26", "c21-26.m4a"),
            manual("Chương 32 - 40", "c32-40.m4a"),
            ...batch(41, 80, 10, 'm4a')
        ]
    },
    {
        id: 21,
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
        id: 22,
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
        id: 23,
        folderName: "TamNhat",
        title: "Tam Nhặt",
        author: "Tô Tha",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/TamNhat/cover.jpg",
        desc: '#Chị gái buôn vũ khí (Hình Tố) x em trai học sinh cấp ba ngỗ nghịch (Lâm Nghiệt)#\nChúng ta nên khuất phục trước cơ thể, bởi vì nó luôn dũng cảm hơn trí óc.\n“Hình Tố, chị có trái tim không?”\n“Cậu hãm sâu quá rồi.”\n\nTrích đoạn truyện Tam Nhặt:\n1\nLâm Nghiệt trở về phòng 1102. Vừa mở cửa đã nghe thấy tiếng thở dốc dữ dội, giọng nam nữ lẫn lộn, giọng nói của người phụ nữ gợi cảm cất lên: “Anh có làm được không? Nửa ngày rồi mà chưa vào nổi.”\nMặt Lâm Nghiệt không cảm xúc, bước ra ban công lấy rượu, ngặt nỗi đi ra đi vào đều phải bước qua phòng ngủ chính, lúc này cũng nghe thấy cuộc đối thoại rất rõ, hình như người đàn ông đó không lên được, còn người phụ nữ kia cũng không nể nang mặt mũi gì mà nói thẳng: “Nhanh quá rồi đấy.”\nVừa nghe xong lời này thì cửa phòng cũng đồng thời mở ra, người phụ nữ đã thay sang một bộ váy ren mỏng, nhìn giống như lụa, đứng đối diện với ánh mắt của Lâm Nghiệt.\nLâm Nghiệt nâng rượu trong tay lên, nói: “Tôi lấy đồ.”\nNgười phụ nữ không tỏ vẻ ngạc nhiên, chỉ khoanh tay dựa vào tường, co chân trái lên rồi tựa vào phía sau.\nLâm Nghiệt thấy cô không tin liền nói thêm: “Thật đó.”\nNgười phụ nữ đó tiếp tục nói: “Tôi hỏi cậu là âm thanh đó nghe có êm tai không?”\n\n2\nHình Tố tạm biệt thầy giáo rồi đi tới sân bay. Hôm nay Hạ Yến Kỷ sẽ đáp chuyến bay về nước.\nNhìn thấy Hạ Yến Kỷ đi ra, Hình Tố kéo kính râm xuống. Trên người anh ta đang mặc chiếc áo len cao cổ do chính tay cô mua. Trước đó anh ta còn nói sẽ luôn mặc chiếc áo này, vậy mà trong đoạn video vài ngày trước lại thấy anh ta đã mặc một chiếc áo len khác, chiếc áo mà cô chưa từng thấy bao giờ.\nNhìn thấy Hình Tố, Hạ Yến Kỷ nở một nụ cười.\nAnh ta có vẻ ngoài điển trai, là một người đàn ông trưởng thành đủ tiêu chuẩn, đây cũng là điều cô mà có thể chắc chắn sau 4 năm chung sống.\nHạ Yến Kỷ bước tới gần Hình Tố rồi đưa tay ôm lấy cô: “Vợ.”\nHình Tố để anh ta ôm mình xong rồi mới lấy giấy bút trong tay ra, nhàn nhạt nói: “Ký đi.”\nNgười đàn ông mỉm cười nhận lấy: “Em lại mua cái gì hả?”\nKhi nhìn thấy năm chữ “Đơn thỏa thuận ly hôn”, anh ta không nhịn được cười, ngẩng đầu nhìn cô, nói: “Ý em là gì?”\nHình Tố: “Ý tôi là tôi muốn ly hôn với anh.”\nHạ Yến Kỷ giống như bị sốc, hồi lâu sau cũng không phản ứng được. Dưới biểu cảm đó của anh ta, Hình Tố bỗng nhiên như biến thành kẻ cặn bã: “Tại sao?”\nHình Tố muốn cho anh ta hiểu, cô lấy máy tính ra, đập lên người Hạ Yến Kỷ: “Đồng bộ hóa icloud, cảm ơn anh đã cho tôi xem hơn 20 video khiêu dâm của chồng mình và những người phụ nữ khác. Chỉ là độ phân giải chưa cao thôi.”\nHạ Yến Kỷ bỗng chốc không nói nên lời.\nHình Tố tỏ ra thờ ơ: “Anh đã sớm chán ghét thì sao không nói với tôi?',
	    isH: true,
        chapters: 76,
        tracks: [
            ...batch(1, 70, 5, 'm4a'),
            manual("Chương 71 - 75 (Hoàn chính văn)", "c71-75.m4a"),
            manual("Phiên ngoại (Hết)", "pn.m4a")
        ]
    },
    {
        id: 24,
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
        id: 25,
        folderName: "NoiDien",
        title: "Nổi Điên",
        author: "Ái Cật Lạt Điều Đích Cửu",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/NoiDien/cover.jpg",
        desc: 'Hắn nói: "Sợ hãi mới là thứ tồn tại lâu dài hơn cả tình yêu."\nHắn nói: "Dù có chết thì Lộ Ngôn Quân tôi cũng muốn Ninh Tri Đường phải thành tro mà chôn cùng tôi."\nHắn nói: "Dù thế nào đi nữa, cả đời này anh đều không buông tay em, nếu không thể yêu anh thì cứ sợ anh đi."\n-\n\nLạnh lùng, u ám chiếm hữu x Đơn thuần ngoan ngoãn.\nLưu ý: Nam chính không có đạo đức, không có tam quan, có thể nói là bệnh hoạn, đến mức điên cuồng. Trong truyện có chứa nhiều tình tiết không phù hợp chuẩn mực, có yếu tố giam cầm, đi theo lối cũ máu chó, không có cảnh nam chính theo đuổi lại nữ chính sau khi đánh mất.',
	    isH: true,
        chapters: 82,
        tracks: [
            ...batch(1, 70, 10, 'm4a'),
            manual("Chương 71 - 75 (Hoàn chính văn)", "c71-75.m4a"),
            manual("Ngoại truyện (Hết)", "nt.m4a")
        ]
    },
    {        
        id: 26,
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
        id: 27,
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
        id: 28,
        folderName: "GiamCamSinhMenh",
        title: "Giam Cầm Sinh Mệnh",
        author: "Khắc Kinh",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/GiamCamSinhMenh/cover.jpg",
        desc: 'Nhà họ Lục có hai chị em, cô chị được yêu quý và cưng chiều, trong khi người em thì bị bỏ qua và lạnh nhạt. Nhà Lục đang có hôn ước với nhà họ Trương giữa thiếu gia Trương và đại tiểu thư Lục gia, nhưng bất ngờ nhà Lục quyết định đưa ra nhị tiểu thư thay cho đại tiểu thư.\nĐại tiểu thư không vui và cảm thấy ganh tị với em gái, cô đã liên kết với mẹ để gây khó khăn cho em. Vì tình yêu với Trương Kỳ, nhị tiểu thư Lục gia đã mướn giang hồ bắt cóc em gái và bán cho bọn buôn người.\nSau đó, số phận của nhị tiểu thư Lục gia sẽ đi đến đâu?',
	    isH: true,
        chapters: 52,
        tracks: [
            ...batch(1, 45, 5, 'm4a'),
            manual("Chương 46 - 50 (Hoàn chính văn)", "c46-50.m4a"),
            manual("Ngoại truyện (Hết)", "nt.m4a")
        ]
    },
    {        
        id: 29,
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
        id: 30,
        folderName: "ChuyenTinhKheNui",
        title: "Chuyện Tình Khe Núi",
        author: "Noãn Dương Tây Tây",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/ChuyenTinhKheNui/cover.jpg",
        desc: 'Anh là một người đàn ông như thế này, chưa từng đến những phố xá sầm uất, cũng chưa từng gặp người mình yêu trong biển người rộng lớn, nửa đời chỉ trú ngụ bên ngọn núi này, nhưng trong tim luôn đặt tình yêu và trách nhiệm ngang nhau, một trái tim không phù phiếm, một chấp niệm không từ bỏ.\nTình cờ gặp gỡ, chờ đợi cô, yêu cô, ngủ với cô, đó chính là trách nhiệm nắm tay nhau cả một đời.\nVăn án sơ lược: Đây là nhật ký viết về cuộc sống ung dung ngày qua ngày của một người đàn ông sống trong núi.\nMột chàng trai dịu dàng, trầm tĩnh, tài "giỏi" và một cô gái có thân phận trước mắt chưa được quyết định, cùng nhau giải mã câu chuyện mới nhé?\nAnh nói: "Em đã đến rồi thì đừng hòng đi."\nNhưng, cô vẫn đi mất...\n\n[Một câu chuyện ngày thường đơn giản, thuận tiện khiến bọn họ yêu nhau đến sống dở chết dở, không xa không rời, sống chết có nhau, kiếp trước kiếp này đều thuộc kiểu cuồng yêu não tàn máu chó...]',
	    isH: true,
        chapters: 65,
        tracks: [
            ...batch(1, 60, 10, 'm4a'),
            manual("Chương 61 - 63 + 2 Ngoại truyện (Hết)", "c61-63+nt.m4a")
        ]
    },
    {        
        id: 31,
        folderName: "SieuCapCungChieu",
        title: "Siêu Cấp Cưng Chiều [đang update 505/1598]",
        author: "Mạn Tây",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/SieuCapCungChieu/cover.jpg",
        desc: 'Lê Tiếu - cô chủ nhỏ được cưng chiều của nhà họ Lê bị từ hôn.\nNgười nhà họ Lê vùng lên khởi nghĩa, chinh phạt khắp nơi, thề phải cho đối phương muối mặt.\n...\nSau đó Lê Tiếu vô tình gặp được anh Cả của người từ hôn.\nCó người nói: Anh ta là người đàn ông thần bí nhất ở Nam Dương, họ Thương, tên Úc, tự Thiếu Diễn.\nCũng có người nói: Anh ta nhìn đời bằng vung, bản tính cố chấp, là ông trùm của thế giới ngầm Nam Dương, không thể chọc vào.\nTrong cơn mưa phùn không dứt, Lê Tiếu nhìn người đàn ông ngang tàng sát phạt, cười khẽ: "Xin chào, tôi là Lê Tiếu."\nKhông làm được vợ chồng, vậy thì làm chị dâu chú vậy.\n...\nMấy tháng sau, gặp nhau giữa đường, người đàn ông từ hôn chê cười Lê Tiếu: "Cô lén theo tôi à? Còn chưa cam lòng sao?"\nSau lưng đột nhiên có giọng nói sắc bén vang lên, "Ăn nói lễ phép với chị dâu cậu một tí!"\nTừ đó, phong ba ở thành Nam Dương chỉ còn lại một lời đồn duy nhất...\nÔng trùm bản tính cố chấp của Nam Dương đội trong tim một cái "bàn thờ", cô họ Lê, tên Tiếu, tự Bàn Thờ!',
	    isH: true,
        chapters: 1598,
        tracks: [
            ...batch(1, 400, 20, 'm4a'),
			...batch(401, 505, 15, 'm4a'),
        ]
    },
    {        
        id: 32,
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
        id: 33,
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
        id: 34,
        folderName: "HamMuon",
        title: "Ham Muốn (Dục Khát)",
        author: "Đông Trúc",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/HamMuon/cover.jpg",
        desc: 'Sau hai năm kết hôn, mẹ chồng luôn luôn ghét thân phận người nông thôn của Tô Bối.\nỞ trước mặt bà con và bạn bè, bà ta tìm cách gây khó khăn cho cô, chế nhạo cô tìm kiếm quyền lực bằng mọi giá, âm thầm và công khai coi thường cô như một con gà không biết đẻ trứng.\nTô Bối không thể đáp trả, mẹ chồng làm khó dễ, ông chồng mình thì vừa ngắn vừa nhỏ vừa nhanh, dục vọng của bản thân không được thỏa mãn.\nĐể giữ cuộc hôn nhân và những gì đang có, Tô Bối hắc hóa, chọn cách quyến rũ cha chồng có khí chất nho nhã để trả thù mẹ chồng.\nVăn Quốc Đống lão luyện và thận trọng, đứng đầu Bộ Tư pháp, có vô số ong bướm vây quanh nhưng lại bị con dâu mê hoặc.\nTô Bối có dung mạo, có đầu óc, từng bước kéo một cán bộ kỳ cựu như cha chồng xuống thần đàn, giẫm mẹ chồng để leo lên vị trí.\nThậm chí còn đưa đứa con mà mình lén lút với cha chồng cho mẹ chồng nuôi…\nCả hai đều ngoại tình, không có tam quan, nữ chính có ngực có não.',
	    isH: true,
        chapters: 215,
        tracks: [
            ...batch(1, 140, 20, 'm4a'),
			...batch(141, 210, 10, 'm4a'),
			manual("Chương 211 - 215 (Hết)", "c211-215.m4a"),
        ]
    },
    {        
        id: 35,
        folderName: "BocKeo",
        title: "Bóc Kẹo",
        author: "Đa Nhục Bồ Đào Hảo Hảo Hát",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/BocKeo/cover.jpg",
        desc: 'Khương Đường là học sinh ba tốt, người cũng như tên ngọt ngào, thanh thuần. Bạn học cùng thầy cô trong trường đều cho rằng cô là một chú thiên nga trắng ngây thơ, xinh đẹp, ngoài việc học và nhảy múa thì không biết gì khác.\nThế nhưng, Lâm Uyên biết, đằng sau gương mặt trong sáng, đáng yêu như thiên sứ ấy là một “mỹ nhân ngư” chuyên đi quyến rũ người. Mà kẻ bị cô câu dẫn, không ai khác chính là anh.\nLần đầu tiên khi tầm mắt hai người chạm vào nhau, cô nhấc lên một góc của làn váy, cũng nhấc lên dục vọng mãnh liệt trong lòng anh. Một cô bé con mới vào cao trung với gương mặt thanh thuần như thế, lại có thể làm ra một động tác sắc tình như vậy. Anh thật muốn hung hăng dạy dỗ cô, để cô hiểu được hậu quả trêu chọc anh là thế nào.\nMột người có lòng câu dẫn.\nMột kẻ có lòng dung túng.\nMỡ dâng đến miệng mèo. Có lý nào mà anh lại không ăn.\nThế là, Khương Đường ngọt như kẹo bị Lâm đại thiếu gia mọi cách hưởng dụng. Từ vườn trường đến biệt thự tư nhân, từ phòng y tế đến thư viện, từ mùa đông qua mùa hè. Bất kể thời gian, bất kể ở đâu, trong một góc kín nào đó, đều có thể thấy được Lâm Uyên vui vẻ bóc cây kẹo ngọt Khương Đường của chính mình, ăn đến sung sướng.\nNhưng dù cuộc sống có thuận lợi đến đâu, cũng sẽ có một vài trắc trở, liệu rằng hai người bọn họ có thể cùng nhau dắt tay đi đến cuối con đường? Mời bạn đọc truyện để tìm hiểu thêm nhé.\n\n***\n\nKhương Đường thoạt nhìn là một cô gái ngoan ngoãn, bên ngoài trong sáng ngây thơ, đôi mắt to tròn ngậm nước, giọng nói vừa ngọt lại vừa mềm, như một viên kẹo mà bất cứ ai cũng thích. Không ai nghĩ, một cô gái như Khương Đường lại đem lòng yêu thầm Lâm đại thiếu gia lạnh lùng, nhiều tật xấu của khóa trên.\nChỉ có một mình Khương Đường biết bởi vì hôm mưa anh đưa chiếc ô, làm trái tim cô chợt có cầu vồng. Mà cô lại không muốn cầu vồng vụt tắt khi mưa chợt tan, mới cố tình tìm cách câu dẫn anh.\nKhương Đường là con gái của nữ minh tinh nổi tiếng Khương Mộng Hi. Thế nhưng, suốt mười sáu năm qua, cô lại không thể công khai gọi một tiếng “mẹ”.\nNgười phụ nữ sinh ra cô vì muốn bảo vệ hình tượng mà giấu cô trong bóng tối. Mặc dù cho cô đầy đủ vật chất, thế nhưng thứ cô cần nhất là tình thương thì lại không thể cho cô dù là một chút.\nVậy nên, trong nội tâm Khương Đường sinh ra sự phản nghịch. Cô giấu kỹ những tâm tư đen tối ấy vào bên trong, bày ra dáng vẻ thanh thuần như một đóa hồng trắng ở bên ngoài.\nCho đến khi cô gặp được Lâm Uyên.\nBởi vì anh, cô không nề hà phơi bày những ý tưởng “đen tối” trong đầu, câu dẫn anh, theo đuổi anh, khiến cho anh “nghiện” cô. Bởi vì, cô muốn anh là của cô.\nKhương Đường không phải là một cô gái thiện lương, cũng không hoàn toàn ngây thơ như dáng vẻ bề ngoài khiến người ta luôn lầm tưởng. Cô là người thông minh, có chủ kiến, có thủ đoạn cũng có lòng sở hữu. Thứ cô muốn có, cô không ngại bỏ ra vốn tiền cược lớn để thu về, cũng sẽ tìm đủ mọi cách “cảnh cáo”, khiến cho không kẻ nào dám động đến Lâm học trưởng của cô.\nLâm Uyên là đại thiếu gia con nhà giàu, gương mặt lạnh lùng mang theo hương vị cấm dục, tính tình tùy hứng. Anh chính là nam thần trong lòng bất kỳ cô gái nào. Người vây quanh anh không ít, âm thầm thích hay trắng trợn khiêu khích chưa bao giờ thiếu. Thế nhưng, anh lại chẳng vừa lòng một ai.\nCho đến khi Khương Đường đến và câu đi mất trái tim anh.\nGương mặt ngây thơ cùng cử chỉ phóng đãng của cô hoàn toàn đối lập. Thế nhưng vô hình chung lại tạo thành một loại mê hoặc đặc biệt, lôi kéo lý trí của anh. Vốn dĩ chỉ muốn chơi đùa, dạy cho cô bài học về hậu quả của việc theo đuổi đàn ông, nhưng không biết từ lúc nào, chính anh lại không thể thoát ra khỏi vị ngọt này.\nLâm Uyên không phải là một người tốt, hút thuốc đánh nhau không gì là không giỏi. Anh là đại thiếu gia nhà giàu, tiền trong túi không thiếu, tính tình kiêu căng ngạo mạn lại nóng nảy tùy hứng.\nBan đầu, anh không thừa nhận bản thân thích Khương Đường, chỉ coi cô là một món ăn mới lạ, tất nhiên trong miệng chẳng có nổi mấy lời hay. Nhưng khi cảm xúc trong trái tim anh dần thay đổi, khi anh hiểu thích một người là như nào, bản chất “trung khuyển” mới bại lộ.\nAnh không phải người kiên nhẫn, nhưng sẽ ngồi chơi game hàng giờ trong phòng chờ cô đến.\nAnh không phải người lãng mạn, nhưng sẽ mua vòng tay khóa cô lại, đánh dấu cô thuộc về anh.\nAnh không phải người biết quan tâm, nhưng sẽ giúp cô mua băng vệ sinh lúc cô đến ngày.\nAnh không phải người dịu dàng, nhưng sẽ bảo vệ cô, dung túng cô trừng trị những kẻ tìm cô gây rối.\nCô là một thứ kẹo ngọt gây nghiện, khiến anh nếm thử một lần rồi quên mất lối về. Mà anh thì cam tâm tình nguyện, dùng cả đời này để nâng niu, hưởng thụ vị ngọt đặc biệt này.\n\n***\n\nThật sự thì đây chỉ là một bộ truyện mang tính giải trí, bạn không nên mang não và quá nhiều yêu cầu khi đọc. Nội dung truyện đơn giản, chủ yếu xoay quanh cuộc sống tình thú của cặp đôi nhân vật chính.\nNhân vật phụ khá nhiều nhưng chủ yếu được xây dựng đơn giản, làm nền cho cặp đôi chính. Một số tính tiết được đưa ra để dẫn dắt nội tâm nhân vật nhưng cũng khá sơ sài, chủ yếu lướt qua để kéo mạch truyện.\nĐây là một bộ truyện dành cho các bạn mê cao H, đọc để ăn thịt là chính, giải trí thư giãn là chủ yếu. Chúc các bạn sắc nữ vui vẻ và hẹn gặp lại ở những review tiếp theo.',
	    isH: true,
        chapters: 88,
        tracks: [
            ...batch(1, 80, 10, 'm4a'),
            manual("Chương 81 - 88", "c81-88.m4a"),
        ]
    },
    {        
        id: 36,
        folderName: "YetKimMon",
        title: "Yết Kim Môn",
        author: "Thượng Quan Thiển Tốc",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/YetKimMon/cover.jpg",
        desc: 'Thể loại: Nguyên sang, Ngôn tình, Dân quốc, HE, Tình cảm, H văn, Ngọt sủng, Song khiết 🕊️, Hào môn thế gia, Đô thị tình duyên, 1v1, Góc nhìn nữ chính.\n\nVĂN ÁN:\nNgay từ lúc chào đời, Thẩm Duật đã có trong tay mọi thứ. Anh là con một, cha lại là vị Đại soái quyền uy một cõi, được người người kính ngưỡng, dã tâm ngút trời, quyền thế hiển hách. Thế nhưng anh lại cố tình vạch rõ ranh giới với người cha ấy.\nNgười ngoài đều nói anh làm vậy vì lý tưởng. Nhưng chỉ có anh mới rõ, ngọn nguồn ban đầu chỉ vì một mối hôn sự hoang đường.\nTrong quãng đời mười mấy năm ngắn ngủi của mình, Thời Vũ cũng từng sống trong nhung lụa. Đáng tiếc thay, cha nàng đột ngột qua đời, để lại một căn nhà toàn là mấy bà vợ kế khó chơi, còn nàng thì không nơi nương tựa.\nĐêm mưa tầm tã ấy, cô bị anh trai và chị dâu đuổi ra khỏi nhà, trong lòng cô chỉ còn lại một ý niệm duy nhất: Phải học xong.\nCô cứ ngỡ, học hành sẽ là lối thoát duy nhất cho mình. Nào ngờ, một cô nhi không gốc rễ chẳng khác gì tấm bia để người ta mặc sức bắt nạt.\nCho đến khi cô gần như tuyệt vọng, Thẩm Duật lại đưa cho cô một tấm vé tàu.\nAnh nói: “Anh cho em tự do mà em muốn.” Rồi dừng lại một nhịp, sau đó nói thêm: “Nhưng có một điều kiện, đó là khi em quay về, em phải làm người của anh.”\nThời Vũ chỉ nghe được vế đầu. Còn vế sau cô lại xem như gió thoảng bên tai.\nCho đến tận sau này, anh tự mình dạy cho cô hiểu: Thứ gọi là “tự do” trong miệng anh là kiểu tự do như thế nào.',
	    isH: true,
        chapters: 58,
        tracks: [
            ...batch(1, 50, 10, 'm4a'),
            manual("Chương 51 - 54 (Hoàn chính văn)", "c51-54.m4a"),
            manual("Ngoại truyện 1 - 4 (Hết)", "nt1-4.m4a"),
        ]
    },
    {        
        id: 37,
        folderName: "ThuongPhong",
        title: "Thượng Phong",
        author: "Tuyết Tùng",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/ThuongPhong/cover.jpg",
        desc: 'Thể loại: Nguyên sang, Ngôn tình, Hiện đại, HE, Tình cảm H văn, Ngọt sủng, Song khiết 🕊️, Vườn trường, Nhẹ nhàng, Đô thị tình duyên, 1v1\n\nVĂN ÁN:\nChung Linh không cẩn thận va vào anh, khiến điện thoại của anh rơi xuống đất rồi vỡ màn hình, nhưng nề hà điện thoại của anh quá đắt, cô chẳng có đủ tiền để đền.\nMà anh chỉ đạm nhiên nói: "Ồ, vậy lấy cái khác đền lại đi."\nCơn chua xót ở hốc mắt còn chưa tan đi, Chung Linh nhìn dáng người thẳng tắp trước mặt, gương mặt thiếu niên xuất chúng không thể bắt bẻ, vì vậy cô đồng ý với yêu cầu sẽ xuất hiện mọi lúc mọi nơi mỗi khi anh cần.\nNhưng ở trước mặt mọi người mà lấy quần áo, mang nước rồi cùng anh ăn cơm...\nNhư vậy có ổn không?\nCó người đồn hai người đang quen nhau, Chung Linh lập tức xua tay làm sáng tỏ, cô sợ người khác sẽ hiểu lầm.\nTrì Thanh Chước tìm được người, ép đến góc khu dạy học, môi lưỡi cường thế vói vào khoang miệng cô, nước miếng không chịu khống chế mà chảy xuống tay anh.\nHôn xong, anh vén sợi tóc của thiếu nữ đang hổn hển thở dốc ra sau tai, thấp giọng hỏi: "Giữa hai chúng ta là quan hệ gì? Hửm?"\nChung Linh cắn chặt môi dưới, sắc mặt ửng hồng không dám nhìn anh, càng chẳng dám trả lời.',
	    isH: true,
        chapters: 106,
        tracks: [
            ...batch(1, 100, 10, 'm4a'),
            manual("Chương 101 - 106 (Hết)", "c101-106.m4a"),
        ]
    },
    {        
        id: 38,
        folderName: "HonDaoNguSay",
        title: "Hòn Đảo Ngủ Say",
        author: "Bạch Nhật Phi Nha",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/HonDaoNguSay/cover.jpg",
        desc: 'Trần Miên của ban xã hội và Thẩm Vực của ban khoa học tự nhiên là hai thế giới đối lập.\nMột người lăn lộn trong vũng bùn, sống qua ngày bằng những công việc lặt vặt.\nNgười kia được bao quanh bởi hào quang, mọi thứ xa hoa, mỗi bước đi đều có xe sang đưa đón.\nBan ngày, bên cạnh Thẩm Vực là những cô gái thay phiên nhau xuất hiện.\nNhưng trong màn đêm, không ai biết rằng anh cúi xuống hôn lên eo Trần Miên, dùng giọng dỗ dành đầy mê hoặc khiến cô không thể kháng cự.\nChờ đợi mãi đến ngày tốt nghiệp, Trần Miên cuối cùng cũng nghĩ mình có thể tự do sống cuộc đời mà cô mong muốn. Nhưng ngay lúc cô rời đi, một bàn tay bất ngờ giữ chặt lấy cổ tay cô.\nGiữa bao ánh mắt, chàng trai lạnh lùng và cao ngạo ngày nào cúi đầu, khẽ cười rồi hỏi:\n"Trần Miên, cậu xem tôi là gì?"\nTrần Miên nhìn anh, giọng điệu vừa bình thản vừa sắc lạnh đáp lại:\n"Chó tôi nuôi."',
	    isH: true,
        chapters: 122,
        tracks: [
            ...batch(1, 60, 10, 'm4a'),
            ...batch(61, 80, 5, 'm4a'),
            ...batch(81, 100, 10, 'm4a'),
            manual("Chương 101 - 105 (Hoàn chính văn)", "c101-105.m4a"),
            manual("Ngoại truyện 1 - 5", "nt1-5.m4a"),
            manual("Ngoại truyện 6 - 10", "nt6-10.m4a"),
            manual("Ngoại truyện 11 - 17 (Hết)", "nt11-17.m4a"),
        ]
    },
    {        
        id: 39,
        folderName: "SayDam",
        title: "Say Đắm",
        author: "Vô Thanh",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/SayDam/cover.jpg",
        desc: 'Thể loại: 19+, H có nội dung, sạch sủng sắc, thanh xuân vườn trường, hài hước, ngọt ngào, 1V1\n\nVăn án:\nĐiều duy nhất mà Thành Ngự không chịu đựng nổi là ánh mắt của Thẩm Vân Hề.\nChỉ cần cô dịu dàng nhìn mình là cậu đã không thể từ chối bất cứ yêu cầu gì của cô…\nNgoại trừ lúc trên giường!!!\nThẩm Vân Hề càng nói “Nhẹ thôi”, cậu lại càng điên cuồng đâm vào bên trong cô.',
	    isH: true,
        chapters: 36,
        tracks: [
            ...batch(1, 30, 10, 'm4a'),
            manual("Chương 31 - 36 (Hết)", "c31-36.m4a"),
        ]
    },
    {        
        id: 40,
        folderName: "TrieuSa",
        title: "Triều Sa",
        author: "Duy Vụ",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/TrieuSa/cover.jpg",
        desc: 'BỘ NÀY BẢN DỊCH CHỮ FULL MÌNH TÌM ĐƯỢC CÓ CHÚT VẤN ĐỀ NHƯNG LẠI TÌM ĐƯỢC AUDIO FULL SẴN NÊN MÌNH DÙNG NÓ LUÔN\n\nĐại tiểu thư xinh đẹp được nuông chiều x Người đàn ông thanh lãnh phúc hắc tinh anh.\nNgôn Trăn rất chán ghét Trần Hoài Tự, cho dù anh là bạn thân nhất của anh trai mình.\nỞ trong mắt cô, Trần Hoài Tự và cô trời sinh bát tự không hợp.\nNgười này giả đứng đắn lại xấu xa, nhất là kỹ thuật diễn tinh vi, giả dạng làm chính nhân quân tử dạng, lừa gạt tất cả mọi người khen anh không dứt miệng.\nNgôn Trăn quyết định vạch trần gương mặt thật của anh.\nKhông nghĩ tới, thường xuyên gặp nhau, cô lại đem cả bản thân mình sa vào.\nCàng không nghĩ tới nữa là, hóa ra anh đã sớm có mưu đồ từ lâu với cô.\nVăn án tóm gọn: Câu chuyện đại tiểu thư hố người không thành công ngược lại bị ăn sạch sẽ.',
	    isH: true,
        chapters: 139,
        tracks: [
            ...batch(1, 30, 10, 'm4a'),
            manual("Chương 31 - 45", "c31-45.m4a"),
            manual("Chương 46 - 50", "c46-50.m4a"),
            ...batch(51, 110, 10, 'm4a'),
            ...batch(111, 125, 5, 'm4a'),
            manual("Chương 126 - 128 (Hoàn chính văn)", "c126-128.m4a"),
            manual("Ngoại truyện 1 - 6", "nt1-6.m4a"),
            manual("Ngoại truyện 7 - 11 (Hết)", "nt7-11.m4a"),
        ]
    },
    {        
        id: 41,
        folderName: "TriAm",
        title: "Trì Âm",
        author: "Duy Vụ",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/TriAm/cover.jpg",
        desc: 'Sau chín năm chia tay lại lần nữa gặp mặt, Thẩm Từ Âm không biết là Ngôn Chiêu vẫn còn tình cũ khó quên trước người bạn gái cũ là mình, huống chi năm đó là cô vứt bỏ anh.\nNhưng sau này cô mới hiểu được, thật ra cô không hiểu Ngôn Chiêu, cũng không hiểu chính bản thân mình.\n\n#Một câu chuyện về cặp đôi vườn trường gương vỡ lại lành\n\nCouple: Thẩm Từ Âm × Ngôn Chiêu\nMỹ nữ điềm tĩnh lý trí × Đại thiếu gia tản mạn "xấu xa"\n\nLưu ý:\n1. Chậm nhiệt, có thịt có cốt truyện\n2. Nam chính bộ này là anh trai của nữ chính và bạn thân của nam chính bộ truyện Triều Sa',
	    isH: true,
        chapters: 88,
        tracks: [
            ...batch(1, 80, 10, 'm4a'),
            manual("Chương 81 - 88 (Hết)", "c81-88.m4a"),
        ]
    },
    {        
        id: 42,
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
        id: 43,
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
        id: 44,
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
        id: 45,
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
        id: 46,
        folderName: "HomNayKhongTien",
        title: "Hôm Nay Không Tiện",
        author: "Tê Nhai",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/HomNayKhongTien/cover.jpg",
        desc: 'Thể loại: Ngôn tình, Cổ đại, HE, Sắc, Hào môn thế gia, Cung đình hầu tước, Cường thủ hào đoạt, 1v1, Thị giác nữ chủ\n\nCouple: Trưởng Công Chúa kiều mỵ x Tể Tướng chó điên, cưỡng chế yêu\n\nVăn án:\nHoàng đế ban cho nàng danh hiệu Gia Nghi, với mong ước nàng sẽ có lời nói tao nhã, cử chỉ đoan trang, trưởng thành trong hạnh phúc và tìm được bến đỗ vững chắc.\nCao Trĩ nép mình trên vai phụ hoàng, nũng nịu: “Chỉ cần Trĩ nhi không xuất giá, Đại Minh Cung mãi mãi là nhà Trĩ nhi.”\nTiếc thay, vận mệnh hoàng gia sau này gặp biến cố, vị công chúa từng được ngàn vạn yêu chiều cũng trở thành cánh chim bị giam cầm, trở thành thú vui riêng của một người trong chốn cung cấm.\nTrên triều, hắn không cho phép bất kỳ ai xúc phạm đến nàng. Hạ triều, hắn lại điên cuồng chiếm đoạt nàng, khiến nàng chìm trong đê mê, không lối thoát.\nĐêm khuya, Tạ tể tướng với ngọn lửa dục vọng hừng hực bước vào tẩm điện của trưởng công chúa.\nCao Trĩ với vẻ yếu đuối đáng thương, nhìn hắn: “Hôm nay không tiện.”\nÁnh mắt Tạ Phi si mê đắm chìm trong mái tóc đen huyền của nàng, không ngần ngại gọi tên thân mật: “Không sao cả, ta càng khao khát được cùng Trĩ nhi triền miên mỗi ngày.”\nTóm lại một câu: Người tưởng chừng mong manh, yếu đuối lại chính là người nắm giữ cán cân quyết định trong cuộc tình này.',
	    isH: true,
        chapters: 85,
        tracks: [
            ...batch(1, 80, 10, 'm4a'),
            manual("Chương 81 - 85 (Hết)", "c81-85.m4a"),
        ]
    },
    {        
        id: 47,
        folderName: "BayMuaHe",
        title: "Bẫy Mùa Hè",
        author: "Boldness",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/BayMuaHe/cover.jpg",
        desc: 'Thể loại: Ngôn tình, Hiện đại, Song khiết, H văn, Song hướng yêu thầm, Thanh mai trúc mã, Sủng, Nhẹ nhàng, Thanh xuân vườn trường, 1v1, HE\n\nSong hướng thầm mến + thanh mai trúc mã = điểm tâm ngọt ngày hè.\nAnh trai lạnh lùng kiềm chế và cô em gái nhỏ mưu mô.\n\nVĂN ÁN:\nVào một đêm hè trời mưa nóng bức, cả tòa nhà bị mất điện.\nCô lao vào vòng tay anh với khuôn mặt đẫm nước mắt: "Anh ơi, em sợ..."\nCách một lớp áo ngủ mỏng manh, cơ thể thiếu nữ mang theo hương thơm thanh mát dán sát lên cơ thể nóng hổi của anh.\nNgoài cửa sổ, tia chớp lóe lên, sấm sét và mưa xối xả, trong phòng nóng nực, anh đổ mồ hôi như mưa, gắt gao ôm cô gái vào lòng an ủi...\nTừ góc độ mà anh không nhìn thấy, cô gái cong mắt cười như một con cáo nhỏ. Nhìn xem, cái bẫy do chính tay cô đào cuối cùng cũng đợi được anh.\n\nLưu ý quan trọng của tác giả, phải đọc trước khi nhảy hố:\nĐối với tag cao h, tất nhiên là trong truyện sẽ xuất hiện rất nhiều cảnh xôi thịt, nhưng vì không chịu nổi việc H không logic, không hợp tình hợp lý... Cho nên giai đoạn đầu tương đối vụn vặt, sẽ có nhiều nội dung làm chất độn, nhưng cũng đảm bảo sẽ có không ít thịt thà ở phía sau. Hi vọng mọi người hiểu.\n\nCảnh báo:  Nam nữ chính quan hệ tinh duc trước 18 tuổi, hai người vẫn còn là học sinh trung học và sẽ có những hành động cùng suy nghĩ vượt quá lứa tuổi nên có, nếu cảm thấy không chấp nhận được vui lòng lướt qua.',
	    isH: true,
        chapters: 132,
        tracks: [
            ...batch(1, 120, 10, 'm4a'),
            manual("Chương 121 - 125 (Hoàn chính văn)", "c121-125.m4a"),
            manual("Ngoại truyện 1 - 7 (Hết)", "nt1-7.m4a"),
        ]
    },
    {        
        id: 48,
        folderName: "ChanhMatOng",
        title: "Chanh Mật Ong [Đang update 41/dự kiến 60 chương]",
        author: "Trà Hoa Đậu Biếc",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/ChanhMatOng/cover.png",
        desc: 'Thể loại: Học đường, lãng mạn, hài hước, truyện teen.\nSố chương (dự kiến): 60 chương (chưa tính ngoại truyện)\n\nLưu ý:\n- Chanh Mật Ong lấy bối cảnh trường học ở Hải Phòng.\n- Truyện được viết lại hoàn toàn. Thiết lập nhân vật và cốt truyện không thay đổi, tôi chỉ bổ sung hoặc khai thác thêm nhân vật, tình tiết để truyện hoàn thiện và logic hơn.\n- Có yếu tố LGBTQ+.\n- Bản trên web có chửi thề (nhưng sẽ censor và tiết chế hơn).\n- Tính tôi cợt nhả và đây là truyện hài nên Chanh Mật Ong không phù hợp cho người nghiêm túc.\n- Giới hạn độ tuổi: 15+.\n- Hãy bình luận nhiều vào nhé! Hãy bình luận nhiều vào nhé! Hãy bình luận nhiều vào nhé! (Chuyện quan trọng phải nói 3 lần, tôi siêu thích đọc bình luận).\n- Anh em có thắc mắc hay ý kiến đóng góp gì, hãy bình luận trực tiếp hoặc nhắn về Fanpage Trà Hoa Đậu Biếc.',
	    isH: false,
        chapters: 60,
        tracks: [
            manual("Chương 0 - 10", "c0-10.m4a"),
            ...batch(11, 40, 10, 'm4a'),
            manual("Chương 41", "c41.m4a"),
        ]
    },
    {        
        id: 49,
        folderName: "YeuChangQuanNhanDangGhet",
        title: "Yêu Chàng Quân Nhân Đáng Ghét [đang update 250/772]",
        author: "Thiền Tâm Nguyệt",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/YeuChangQuanNhanDangGhet/cover.jpg",
        desc: 'Sống lại một lần nữa, Mục Ảnh Sanh nghĩ thầm, thật là tốt. Thoát khỏi những uất ức ở kiếp trước, kiếp này cô có thể làm lại từ đầu. Đấu trí với người nhà, đăng kí vào trường quân đội trở thành bộ đội đặc chủng. Có thể hoàn thành ước mơ trở thành quân nhân.\nThế nhưng khi gặp lại kẻ không đội trời chung từ kiếp trước, cô vẫn tức giận đến nghiến răng kèn kẹt.\nLà anh kiếp trước luôn đối nghịch với tôi, là anh kiếp trước luôn ngáng đường tôi đi. Lần này tôi biết trước được tương lai, xem tôi đối phó với anh thế nào.\nChẳng qua cô đột nhiên lại phát hiện, người đàn ông ở trước mặt này phong thái hình như có vẻ gì đó là lạ.\nChàng trai anh tuấn đĩnh đạc từng bước tiến tới gần, cô bị anh áp sát lui về phía sau.\n“Việc thăng cấp thuộc về em. Yên tâm, sẽ không ai tranh với em.”\n“Anh có ý gì?” Người đàn ông cười rộ lên để lộ hàm răng trắng, cô lại cảm thấy lỗ chân lông mình dựng đứng lên. Có quỷ mới tin anh ta tự nhiên lại tốt bụng như vậy.\n“Không có ý gì.” Người đàn ông tiến về phía trước, dồn cô áp vào góc tường, ánh mắt thâm thúy tràn ngập vẻ chiếm hữu: “Cấp bậc thuộc về em, em thuộc về anh.”',
	    isH: false,
        chapters: 772,
        tracks: [
            ...batch(1, 20, 10, 'm4a'),
            manual("Chương 21 - 25", "c21-25.m4a"),
            manual("Chương 26", "c26.m4a"),
            manual("Chương 27 - 30", "c27-30.m4a"),
            ...batch(31, 40, 5, 'm4a'),
            ...batch(41, 140, 10, 'm4a'),
            ...batch(141, 250, 5, 'm4a'),
        ]
    },
];
