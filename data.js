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

// Mock Data
const LIBRARY = [
    {
        id: 1,
        folderName: "ChinhPhucDoiThuDenNghien",
        title: "Chinh Phục Đối Thủ Đến Nghiện",
        author: "A Sấu A",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/ChinhPhucDoiThuDenNghien/cover.jpg",
        desc: "Hai người có tiếng cả đời không qua lại với nhau, không chỉ là cạnh tranh trong việc học hành mà còn nhìn đối phương không vừa mắt.\nNhưng không ai biết, trong âm thầm, bọn họ thường xuyên ra vào Như Gia thuê phòng bắn pháo.\nLục Hoài Chuẩn: Bạn gái người khác ở trên giường đều là xoắn xuýt lấy dương vật của bạn trai, lẳng lơ hăng say kêu: “A, dương vật của chồng lớn quá, làm người ta thật sướng.”\nBạn gái của tôi lại không giống vậy, cô ấy ở trên người tôi vặn vẹo hăng say và hỏi: “Đáp án đề tự luận cuối cùng trong bài thi toán học của anh là gì?”",
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
	    chapters: 158,
        tracks: [
            ...batch(1, 140, 10), 
            tr(141, 153),
            manual("Ngoại truyện 1 - 5 (Hết)", "nt1-5.mp3")
        ]
    },
    {
        id: 6,
        folderName: "AnhDenHoaLe",
        title: "Ánh Đèn Hoa Lệ",
        author: "Phất Hà Lão Yêu",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/AnhDenHoaLe/cover.jpg",
        desc: "Ở một góc phố đèn đỏ tại Vũ Hán có một tiệm trang điểm tên Trân Trân, chủ tiệm Giang Ánh Nghê tuy dữ dằn nhưng lại có tay nghề rất đỉnh.\nVào sinh nhật 19 tuổi, Giang Ánh Nghê tới trường lái ghi danh.\n“Học số sàn hay số tự động?”\nNgười đàn ông ngước lên nhìn cô gái trẻ trang điểm rất đậm: “Đã thành niên chưa?”\n“19.”\nGiang Ánh Nghê đặt thẻ căn cước công dân của mình lên bài đánh “rầm” một tiếng, lạnh lùng nhìn người đàn ông kia, mới hay ông chú này chính là một vị khách quen của khu phố đèn đỏ...\n“Số sàn 3000 tệ, bao dạy ba năm.” Rồi anh ta tỉnh bơ nói: “Trả bằng quét mã Alipay hoặc Wechat.”\n“Bớt chút được không?” Thái độ của cô rất đỗi ngang ngược.\n“Không được.” Anh lại liếc nhìn cô, “Về nhà bàn bạc với bố mẹ đi, xong hẵng tới ghi danh.”\n“Em không có bố mẹ.”\nGiang Ánh Nghê thôi trả giá, vừa quét mã trả tiền vừa hỏi: “Thực hành ai dạy thế?”\n“Em muốn ai dạy?” Anh nói: “Chỗ tôi có sáu giáo viên.”\nCô đáp: “Em muốn anh.”\nAnh nhướng mày, “Tôi là ông chủ, lười dạy lắm.”\n“Anh có dạy không thì bảo?” Giang Ánh Nghê hất cằm hỏi.\nAnh phì cười: “Có thể cân nhắc.”",
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
	    chapters: 102,
        tracks: [
            ...batch(1, 90, 5),
            manual("Chương 91 - 96 (Hoàn chính văn)", "c91-96.mp3"),
            manual("Ngoại truyện 1 - 6 (Hết)", "nt1-6.mp3")
        ]
    },
    {
        id: 11,
        folderName: "NuPhuTraXanhTroThanhDoChoiCuaNamChinh",
        title: "Nữ Phụ Trà Xanh Trở Thành Đồ Chơi Của Nam Chính",
        author: "Miên Nhuyễn Nhuyễn",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/NuPhuTraXanhTroThanhDoChoiCuaNamChinh/cover.jpg",
        desc: "Một câu chuyện khác của nguyên tác “Sau khi bị vả mặt, nữ phụ trèo lên người nam chính (H)”, không còn những tình tiết xuyên sách, đi theo con đường hiện thực tối tăm, tuyến đường cưỡng chế yêu, nhiều H, ngọt ngào.\n\nNữ phụ trà xanh từng bước gặp khó khăn X nam chính không hề che giấu sự ác liệt của mình mà dạo chơi nhân gian.\n\nCô gái đáng thương sinh ra trong gia đình bình thường bị thiếu gia nhà giàu đùa bỡn, thời gian đầu chỉ thích làm tình không thích yêu đương.\n\n“Trà xanh bạch liên”, “tiểu tam”, “tâm cơ”, “quyến rũ Nghiêm Kỷ” đây là những nhãn dán của Mộc Trạch Tê, luôn khiến người ta khinh thường.\n“Học sinh ba tốt”, “nghiêm túc đứng đắn”, “ thân thiện với mọi người “, “dịu dàng” đây là những nhãn dán của Nghiêm Kỷ, được người người khen ngợi.\n\nTừ nhỏ, Mộc Trạch Tê đã có người mẹ luôn mang vọng tưởng bám víu vào những gia đình quyền quý, đương nhiên cô cũng bị dính vào kế hoạch ấy.\nĐể tiếp cận Nghiêm Kỷ, cô dùng đủ mọi cách, thậm chí còn làm khó Lâm Thi Vũ, người tự nhiên thân thiết với Nghiêm Kỷ.\nTất cả những gì cô nhận được cũng chỉ là sự hờ hững và xa cách của Nghiêm Kỷ.\nMộc Trạch Tê từ bỏ...\nDưới lớp ngụy trang của mình, Nghiêm Kỷ là một kẻ vô cùng độc ác. Thái độ của anh với mọi thứ như thần linh dạo chơi nhân gian, sau đó lại nhận ra bản thân mình là kẻ xấu xa, thích làm việc ác nhưng không muốn mình bị mọi người chế nhạo.\nAnh thích kiểm soát và theo đuổi những thứ kích thích.\nKhi phát hiện ra người vẫn luôn theo đuổi mình từ khi còn nhỏ - Mộc Trạch Tê, muốn chạy sang vòng tay của kẻ khác, anh phát điên lên. Sau khi ăn sạch người ta vào miệng, anh ăn tủy biết vị [1] phát hiện niềm vui sướng mỗi khi đùa bỡn Mộc Trạch Tê.\nMộc Trạch Tê vẫn luôn dựa vào dáng người của mình để quyến rũ được Nghiêm Kỷ, giúp mẹ cô có thể từng bước tiến vào nhà họ Nghiêm giàu sang, quyền thế.\nNhưng chỉ có mình Mộc Trạch Tê biết được, đằng sau nét cười ôn hòa là sự u tối chỉ biết làm tình của anh.\nĐây là câu chuyện nguyên bản của “Sau khi bị vả mặt nữ phụ trèo cao có được nam chính (H)”.\nLà một câu chuyện thể hiện ý chí của một người phụ nữ chỉ có nhan sắc nhưng lại muốn leo lên một gia đình giàu có, lấy nhan sắc để phục vụ dục vọng của người khác. (Hai người có tình cảm, nhưng không cản trở nam chính ham mê nữ sắc, vẫn chóa lắm).\nNếu không thích, thì nhanh chạy!.\nBởi vì là một câu chuyện khác nên sẽ có cảnh mới, cũng sẽ có một số cảnh và văn bản là trong “Nữ phụ vả mặt”. Chuyện nguyên bản, cùng một cảnh tượng nhưng câu chuyện khác nhau.\nTính cách của nhân vật cơ bản không thay đổi, nhưng nội dung cốt truyện sẽ đi theo hướng khác.",
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
	    chapters: 178,
        tracks: [
            ...batch(1, 175, 5, 'm4a'),
            manual("Chương 176 - 177 (Hoàn chính văn)", "c176-177.m4a"),
            manual("Ngoại truyện", "nt.m4a")
        ]
    },
    {
        id: 13,
        folderName: "PhongHoaHoaCot",
        title: "Phong Hoa Hoạ Cốt",
        author: "Khúc Tiểu Khúc",
        cover: "https://github.com/truyenhaymoingay2024/sourceTruyen/raw/main/PhongHoaHoaCot/cover.png",
        desc: "[1]\nTạ Thanh Yến là đệ nhất nho tướng của triều Đại Dận, là người mang phong thái thanh khiết như gió xuân trăng sáng, nhã nhặn đoan chính, lập vô số chiến công hiển hách. Vì thế mà được người đời tôn xưng là “Xuân Sơn công tử”, thiên hạ ca tụng rằng: “Một lần gặp ngày xuân về, khắp kinh thành đỏ rực tay áo vẫy chào.”\nTrong triều, ai ai cũng ngưỡng mộ và tôn kính chàng, các tiểu thư quyền quý nơi kinh thành lại coi chàng như đấng lang quân trong mộng cao cao tại thượng, đến cả biểu muội của chàng là Trưng Dương công chúa cũng thầm thương trộm nhớ, dây dưa chẳng dứt.\nĐáng tiếc là chàng đã đính ước hôn nhân với Khánh Quốc Công phủ, chỉ chờ đích nữ trong phủ là Thích Uyển Nhi đến ngày xuất giá là sẽ kết duyên, tạo nên một câu chuyện đẹp.\nTin đồn kết thân vừa lan ra, trái tim của hàng ngàn thiếu trong nữ kinh thành tan vỡ chỉ sau một đêm, nhưng chỉ có một người thở phào nhẹ nhõm —\nĐó chính là Thích Bạch Thương, con gái thứ và là chị cùng cha khác mẹ của Thích Uyển Nhi – vị hôn thê tương lai của Tạ Thanh Yến.\n\n[2]\nThích Bạch Thương vẫn luôn biết rằng, trong mắt Tạ Thanh Yến, nàng chỉ là vật thay thế cho đích muội Thích Uyển Nhi mà thôi.\nĐích muội tôn quý, dịu dàng và nhã nhặn, cầm kỳ thi họa nổi danh kinh thành, được ca tụng là Đệ nhất tài nữ kinh đô.\nCòn nàng thì xuất thân thấp kém và thô thiển, thậm chí còn mang tai tiếng hồi nhỏ từng lưu lạc ở thanh lâu suốt một năm.\nThế nên Tạ Thanh Yến khinh rẻ và trêu đùa nàng. Ban ngày, chàng đối diện với đích muội ôn hòa và giữ lễ như một quân tử đoan chính, nhưng đêm đến lại xé toạc lớp vỏ bọc, đối xử với nàng bằng sự tàn bạo và ác ý tột cùng trong màn trướng uyên ương.\nChàng nâng đỡ đích muội nàng lên tận mây xanh, nhưng lại nhấn chìm nàng xuống bùn nhơ.\nNhưng trớ trêu thay, đối với Thích Bạch Thương, Uyển Nhi lại là cô gái tốt nhất trong triều Đại Dận. Trong Quốc Công phủ rộng lớn, vô số ánh mắt lạnh lùng, nàng từ nhỏ động một tí là mắc lỗi, chỉ có Uyển Nhi là tương trợ và đỡ đần nàng. Nàng lại càng không thể đến trước mặt Uyển Nhi mà vạch trần bộ mặt thật của người kia.\n“Hôm nay, Uyển Nhi lại cùng công tử nhà họ Tần nhìn nhau thêm hai lần.”\nĐêm đã khuya, người đàn ông ban ngày thanh chính nho nhã lúc này lại như một quái thú lười biếng hung dữ, dựa vào bức tường trong căn phòng thứ nữ chật hẹp và cũ nát của nàng. Chàng tiện tay vò chiếc áo choàng lụa gấm quý giá ở dưới thân nàng, chàng cố ý và ác ý gợi ra những tiếng khóc nức nở khó nén của nàng:\n“Tối nay, ngươi hãy thay nàng chịu phạt đi —”\n“Thêm hai nén hương nữa là được.”\n\n[3]\nCuối cùng, mối thù của mẹ ruột đã được báo, Thích Bạch Thương không cần phải giả vờ làm thân với bất kỳ ai nữa, nàng quyết định rời khỏi kinh đi.\nVào lúc này, Tạ Thanh Yến đã đạt được ước nguyện bấy lâu và sắp kết hôn cùng Thích Uyển Nhi. Thích Bạch Thương cũng đã tìm được cho mình một người chồng như ý. Đối phương tuy xuất thân có phần thấp kém hơn, nhưng lại không chê bai tiếng tăm của nàng, đối xử chân thành với nàng, và sẵn lòng kết hôn, cưới nàng về làm vợ.\nThích Bạch Thương cứ nghĩ rằng mình đã có thể thoát khỏi nanh vuốt của ma quỷ rồi.\nTuy nhiên nàng không ngờ rằng, đêm đó khi khăn che mặt màu đỏ được vén lên, người xuất hiện trước mặt nàng lại chính là Tạ Thanh Yến – người đáng lẽ ra phải đang cử hành hôn lễ với Uyển Nhi ở trong kinh thành hoa lệ nhất.\nKẻ điên này vẫn đang mặc y phục tân lang, đai lụa vàng ngọc, trong khi đó tân lang của nàng lại bị trói dưới đất, phía sau, cửa phòng tân hôn mở toang, trong sân đèn đuốc sáng trưng. Huyền Khải Quân áo giáp đen lạnh lẽo, áo giáp uy nghiêm, lưỡi đao sáng như tuyết.\nTạ Thanh Yến đứng một mình trước hàng quân, dùng ánh mắt hung ác và đầy sát khí như muốn xé xác nuốt trọn nàng mà quét qua, rồi lại bật cười.\n“Dám chạy trốn? Tốt lắm.”\nChàng nắm lấy dải lụa thắt ở giá y của nàng, rồi từ từ kéo ra: “Vậy đêm nay, cứ để cho thiên hạ tận mắt thấy, ta sẽ làm tân lang của ngươi trong đêm này như thế nào.”\n\n—\n\n[Lưu ý trước khi đọc]\n(1) Văn án có chứa yếu tố tự sự lừa dối từ góc nhìn đơn nhất, bao gồm các yếu tố cẩu huyết như: án cũ nhiều năm, thù lớn gia tộc, cưỡng ép chiếm đoạt, tình yêu và thù hận, yêu mà không thể nói. Không khuyến khích những người không thích thể loại này mà còn hay vặn vẹo và bắt bẻ đọc.\n(2) Nam chính không yêu bất kỳ ai ngoài nữ chính, bao gồm cả chính bản thân hắn, nhưng hắn lại cực kỳ tồi tệ, vừa tồi tệ lại vừa điên cuồng.\n(3) Bối cảnh giả tưởng, chế độ bối cảnh được pha trộn.\n\n—\n\nTóm tắt một câu: Vợ chồng có mối thù truyền kiếp, vừa hận vừa yêu.\nÝ tưởng chính: Minh oan cho nỗi oan khuất, dẹp loạn chỉnh lại trật tự.\nTags: Cung đấu – Chỉ yêu một người – Trời sinh một cặp – Yêu hận đan xen – Báo thù và hành hạ kẻ cặn bã – Chính kịch.\n【Song phục thù, Minh oan và lật lại bản án; Cưỡng ép chiếm đoạt, Tình yêu rộng lớn như trời, hận thù sâu như biển】",
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
	    chapters: 35,
        tracks: [
            ...batch(1, 30, 5, 'm4a'),
            manual("Chương 31 - 35 (Hoàn chính văn)", "c31-35.m4a")
        ]
    },
];

