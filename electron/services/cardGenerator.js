/**
 * 银行卡生成器
 * 使用 Luhn 算法生成有效的银行卡号
 */

class CardGenerator {
  /**
   * Luhn 算法校验
   */
  static luhnCheck(cardNumber) {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * 计算 Luhn 校验位
   */
  static calculateLuhnCheckDigit(partialNumber) {
    let sum = 0;
    let isEven = true;
    
    for (let i = partialNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(partialNumber[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return (10 - (sum % 10)) % 10;
  }


  /**
   * 根据 BIN 头生成完整卡号
   */
  static generateCardNumber(bin) {
    bin = String(bin);
    const totalLength = 16;
    const randomLength = totalLength - bin.length - 1;
    
    let randomPart = '';
    for (let i = 0; i < randomLength; i++) {
      randomPart += Math.floor(Math.random() * 10);
    }
    
    const partialNumber = bin + randomPart;
    const checkDigit = this.calculateLuhnCheckDigit(partialNumber);
    
    return partialNumber + checkDigit;
  }

  /**
   * 生成随机有效期（未来1-3年）
   */
  static generateExpiry() {
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const yearsAhead = Math.floor(Math.random() * 3) + 1;
    let year = currentYear + yearsAhead;
    let month = Math.floor(Math.random() * 12) + 1;
    
    return {
      month: String(month).padStart(2, '0'),
      year: String(year).padStart(2, '0')
    };
  }

  /**
   * 生成随机 CVV
   */
  static generateCVV() {
    return String(Math.floor(Math.random() * 900) + 100);
  }


  /**
   * 中国姓氏（常见100个）
   */
  static getChineseSurnames() {
    return [
      '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
      '徐', '孙', '马', '胡', '朱', '郭', '何', '罗', '高', '林',
      '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹',
      '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡',
      '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈',
      '姚', '卢', '姜', '崔', '钟', '谭', '陆', '汪', '范', '金',
      '石', '廖', '贾', '夏', '韦', '付', '方', '白', '邹', '孟',
      '熊', '秦', '邱', '江', '尹', '薛', '闫', '段', '雷', '侯',
      '龙', '史', '陶', '黎', '贺', '顾', '毛', '郝', '龚', '邵',
      '万', '钱', '严', '覃', '武', '戴', '莫', '孔', '向', '汤'
    ];
  }

  /**
   * 中国名字（男性常见）
   */
  static getChineseMaleNames() {
    return [
      '伟', '强', '磊', '军', '勇', '杰', '涛', '明', '超', '华',
      '刚', '平', '辉', '鹏', '飞', '波', '斌', '宇', '浩', '凯',
      '健', '俊', '峰', '龙', '亮', '建', '文', '博', '志', '海',
      '威', '彬', '林', '成', '东', '旭', '阳', '晨', '帅', '康',
      '毅', '昊', '然', '睿', '轩', '翔', '航', '鑫', '宁', '乐'
    ];
  }

  /**
   * 中国名字（女性常见）
   */
  static getChineseFemaleNames() {
    return [
      '芳', '娟', '敏', '静', '丽', '艳', '娜', '秀', '英', '华',
      '慧', '巧', '美', '婷', '玲', '燕', '红', '春', '菊', '兰',
      '凤', '洁', '梅', '琳', '素', '云', '莲', '真', '霞', '翠',
      '雪', '荣', '爱', '妹', '霜', '香', '月', '莺', '媛', '艳',
      '瑞', '凡', '佳', '嘉', '琼', '桂', '娣', '叶', '璧', '璐'
    ];
  }


  /**
   * 生成随机中国姓名
   */
  static generateChineseName() {
    const surnames = this.getChineseSurnames();
    const maleNames = this.getChineseMaleNames();
    const femaleNames = this.getChineseFemaleNames();
    
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const isMale = Math.random() > 0.5;
    const names = isMale ? maleNames : femaleNames;
    
    // 随机1-2个字的名
    const nameLength = Math.random() > 0.3 ? 2 : 1;
    let givenName = '';
    for (let i = 0; i < nameLength; i++) {
      givenName += names[Math.floor(Math.random() * names.length)];
    }
    
    return surname + givenName;
  }

  /**
   * 中国省份城市数据（包含多个城市和区县）
   */
  static getChinaProvinceData() {
    return {
      '北京市': {
        cities: {
          '北京市': {
            districts: ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '顺义区', '通州区', '大兴区', '房山区', '门头沟区', '昌平区'],
            zipBase: '100'
          }
        }
      },
      '天津市': {
        cities: {
          '天津市': {
            districts: ['和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', '东丽区', '西青区', '津南区', '北辰区', '武清区', '宝坻区'],
            zipBase: '300'
          }
        }
      },
      '上海市': {
        cities: {
          '上海市': {
            districts: ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区'],
            zipBase: '200'
          }
        }
      },
      '重庆市': {
        cities: {
          '重庆市': {
            districts: ['渝中区', '大渡口区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '渝北区', '巴南区', '万州区', '涪陵区'],
            zipBase: '400'
          }
        }
      },
      '广东省': {
        cities: {
          '广州市': { districts: ['越秀区', '海珠区', '荔湾区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区'], zipBase: '510' },
          '深圳市': { districts: ['罗湖区', '福田区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区', '坪山区', '光明区'], zipBase: '518' },
          '珠海市': { districts: ['香洲区', '斗门区', '金湾区'], zipBase: '519' },
          '东莞市': { districts: ['莞城街道', '南城街道', '东城街道', '万江街道', '石碣镇', '石龙镇', '茶山镇', '石排镇'], zipBase: '523' },
          '佛山市': { districts: ['禅城区', '南海区', '顺德区', '三水区', '高明区'], zipBase: '528' }
        }
      },
      '浙江省': {
        cities: {
          '杭州市': { districts: ['上城区', '下城区', '江干区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '富阳区', '临安区'], zipBase: '310' },
          '宁波市': { districts: ['海曙区', '江北区', '北仑区', '镇海区', '鄞州区', '奉化区'], zipBase: '315' },
          '温州市': { districts: ['鹿城区', '龙湾区', '瓯海区', '洞头区', '瑞安市', '乐清市'], zipBase: '325' },
          '嘉兴市': { districts: ['南湖区', '秀洲区', '嘉善县', '海盐县', '海宁市', '平湖市', '桐乡市'], zipBase: '314' }
        }
      },
      '江苏省': {
        cities: {
          '南京市': { districts: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区', '六合区', '溧水区'], zipBase: '210' },
          '苏州市': { districts: ['虎丘区', '吴中区', '相城区', '姑苏区', '吴江区', '昆山市', '太仓市', '常熟市', '张家港市'], zipBase: '215' },
          '无锡市': { districts: ['锡山区', '惠山区', '滨湖区', '梁溪区', '新吴区', '江阴市', '宜兴市'], zipBase: '214' },
          '常州市': { districts: ['天宁区', '钟楼区', '新北区', '武进区', '金坛区', '溧阳市'], zipBase: '213' }
        }
      },
      '山东省': {
        cities: {
          '济南市': { districts: ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区', '章丘区', '济阳区'], zipBase: '250' },
          '青岛市': { districts: ['市南区', '市北区', '黄岛区', '崂山区', '李沧区', '城阳区', '即墨区', '胶州市'], zipBase: '266' },
          '烟台市': { districts: ['芝罘区', '福山区', '牟平区', '莱山区', '龙口市', '莱阳市', '莱州市', '招远市'], zipBase: '264' },
          '潍坊市': { districts: ['潍城区', '寒亭区', '坊子区', '奎文区', '临朐县', '昌乐县', '青州市', '诸城市'], zipBase: '261' }
        }
      },
      '四川省': {
        cities: {
          '成都市': { districts: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '青白江区', '新都区', '温江区', '双流区'], zipBase: '610' },
          '绵阳市': { districts: ['涪城区', '游仙区', '安州区', '江油市', '三台县', '盐亭县', '梓潼县'], zipBase: '621' },
          '德阳市': { districts: ['旌阳区', '罗江区', '广汉市', '什邡市', '绵竹市', '中江县'], zipBase: '618' }
        }
      },
      '湖北省': {
        cities: {
          '武汉市': { districts: ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '青山区', '洪山区', '东西湖区', '蔡甸区', '江夏区'], zipBase: '430' },
          '宜昌市': { districts: ['西陵区', '伍家岗区', '点军区', '猇亭区', '夷陵区', '宜都市', '当阳市', '枝江市'], zipBase: '443' },
          '襄阳市': { districts: ['襄城区', '樊城区', '襄州区', '南漳县', '谷城县', '保康县', '老河口市', '枣阳市'], zipBase: '441' }
        }
      },
      '湖南省': {
        cities: {
          '长沙市': { districts: ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区', '望城区', '长沙县', '浏阳市', '宁乡市'], zipBase: '410' },
          '株洲市': { districts: ['荷塘区', '芦淞区', '石峰区', '天元区', '渌口区', '醴陵市'], zipBase: '412' },
          '湘潭市': { districts: ['雨湖区', '岳塘区', '湘潭县', '湘乡市', '韶山市'], zipBase: '411' }
        }
      },
      '河南省': {
        cities: {
          '郑州市': { districts: ['中原区', '二七区', '管城回族区', '金水区', '上街区', '惠济区', '中牟县', '巩义市', '荥阳市', '新密市'], zipBase: '450' },
          '洛阳市': { districts: ['老城区', '西工区', '瀍河回族区', '涧西区', '吉利区', '洛龙区', '偃师区', '孟津区'], zipBase: '471' },
          '开封市': { districts: ['龙亭区', '顺河回族区', '鼓楼区', '禹王台区', '祥符区', '杞县', '通许县', '尉氏县'], zipBase: '475' }
        }
      },
      '福建省': {
        cities: {
          '福州市': { districts: ['鼓楼区', '台江区', '仓山区', '马尾区', '晋安区', '长乐区', '闽侯县', '连江县', '罗源县'], zipBase: '350' },
          '厦门市': { districts: ['思明区', '海沧区', '湖里区', '集美区', '同安区', '翔安区'], zipBase: '361' },
          '泉州市': { districts: ['鲤城区', '丰泽区', '洛江区', '泉港区', '惠安县', '安溪县', '永春县', '德化县'], zipBase: '362' }
        }
      },
      '陕西省': {
        cities: {
          '西安市': { districts: ['新城区', '碑林区', '莲湖区', '灞桥区', '未央区', '雁塔区', '阎良区', '临潼区', '长安区', '高陵区'], zipBase: '710' },
          '咸阳市': { districts: ['秦都区', '杨陵区', '渭城区', '三原县', '泾阳县', '乾县', '礼泉县', '永寿县'], zipBase: '712' },
          '宝鸡市': { districts: ['渭滨区', '金台区', '陈仓区', '凤翔区', '岐山县', '扶风县', '眉县', '陇县'], zipBase: '721' }
        }
      },
      '辽宁省': {
        cities: {
          '沈阳市': { districts: ['和平区', '沈河区', '大东区', '皇姑区', '铁西区', '苏家屯区', '浑南区', '沈北新区', '于洪区'], zipBase: '110' },
          '大连市': { districts: ['中山区', '西岗区', '沙河口区', '甘井子区', '旅顺口区', '金州区', '普兰店区'], zipBase: '116' },
          '鞍山市': { districts: ['铁东区', '铁西区', '立山区', '千山区', '海城市', '台安县', '岫岩满族自治县'], zipBase: '114' }
        }
      },
      '吉林省': {
        cities: {
          '长春市': { districts: ['南关区', '宽城区', '朝阳区', '二道区', '绿园区', '双阳区', '九台区', '农安县'], zipBase: '130' },
          '吉林市': { districts: ['昌邑区', '龙潭区', '船营区', '丰满区', '永吉县', '蛟河市', '桦甸市', '舒兰市'], zipBase: '132' }
        }
      },
      '黑龙江省': {
        cities: {
          '哈尔滨市': { districts: ['道里区', '南岗区', '道外区', '平房区', '松北区', '香坊区', '呼兰区', '阿城区', '双城区'], zipBase: '150' },
          '齐齐哈尔市': { districts: ['龙沙区', '建华区', '铁锋区', '昂昂溪区', '富拉尔基区', '碾子山区', '梅里斯达斡尔族区'], zipBase: '161' }
        }
      },
      '安徽省': {
        cities: {
          '合肥市': { districts: ['瑶海区', '庐阳区', '蜀山区', '包河区', '长丰县', '肥东县', '肥西县', '庐江县', '巢湖市'], zipBase: '230' },
          '芜湖市': { districts: ['镜湖区', '弋江区', '鸠江区', '湾沚区', '繁昌区', '南陵县', '无为市'], zipBase: '241' },
          '蚌埠市': { districts: ['龙子湖区', '蚌山区', '禹会区', '淮上区', '怀远县', '五河县', '固镇县'], zipBase: '233' }
        }
      },
      '江西省': {
        cities: {
          '南昌市': { districts: ['东湖区', '西湖区', '青云谱区', '青山湖区', '新建区', '红谷滩区', '南昌县', '安义县', '进贤县'], zipBase: '330' },
          '九江市': { districts: ['濂溪区', '浔阳区', '柴桑区', '武宁县', '修水县', '永修县', '德安县', '都昌县'], zipBase: '332' },
          '赣州市': { districts: ['章贡区', '南康区', '赣县区', '信丰县', '大余县', '上犹县', '崇义县', '安远县'], zipBase: '341' }
        }
      },
      '河北省': {
        cities: {
          '石家庄市': { districts: ['长安区', '桥西区', '新华区', '井陉矿区', '裕华区', '藁城区', '鹿泉区', '栾城区'], zipBase: '050' },
          '唐山市': { districts: ['路南区', '路北区', '古冶区', '开平区', '丰南区', '丰润区', '曹妃甸区', '滦南县'], zipBase: '063' },
          '保定市': { districts: ['竞秀区', '莲池区', '满城区', '清苑区', '徐水区', '涞水县', '阜平县', '定兴县'], zipBase: '071' }
        }
      },
      '山西省': {
        cities: {
          '太原市': { districts: ['小店区', '迎泽区', '杏花岭区', '尖草坪区', '万柏林区', '晋源区', '清徐县', '阳曲县', '娄烦县'], zipBase: '030' },
          '大同市': { districts: ['新荣区', '平城区', '云冈区', '云州区', '阳高县', '天镇县', '广灵县', '灵丘县'], zipBase: '037' }
        }
      },
      '内蒙古自治区': {
        cities: {
          '呼和浩特市': { districts: ['新城区', '回民区', '玉泉区', '赛罕区', '土默特左旗', '托克托县', '和林格尔县', '清水河县'], zipBase: '010' },
          '包头市': { districts: ['东河区', '昆都仑区', '青山区', '石拐区', '白云鄂博矿区', '九原区', '土默特右旗', '固阳县'], zipBase: '014' }
        }
      },
      '广西壮族自治区': {
        cities: {
          '南宁市': { districts: ['兴宁区', '青秀区', '江南区', '西乡塘区', '良庆区', '邕宁区', '武鸣区', '隆安县', '马山县'], zipBase: '530' },
          '桂林市': { districts: ['秀峰区', '叠彩区', '象山区', '七星区', '雁山区', '临桂区', '阳朔县', '灵川县', '全州县'], zipBase: '541' }
        }
      },
      '云南省': {
        cities: {
          '昆明市': { districts: ['五华区', '盘龙区', '官渡区', '西山区', '东川区', '呈贡区', '晋宁区', '富民县', '宜良县'], zipBase: '650' },
          '大理白族自治州': { districts: ['大理市', '漾濞彝族自治县', '祥云县', '宾川县', '弥渡县', '南涧彝族自治县', '巍山彝族回族自治县'], zipBase: '671' }
        }
      },
      '贵州省': {
        cities: {
          '贵阳市': { districts: ['南明区', '云岩区', '花溪区', '乌当区', '白云区', '观山湖区', '清镇市', '开阳县', '息烽县'], zipBase: '550' },
          '遵义市': { districts: ['红花岗区', '汇川区', '播州区', '桐梓县', '绥阳县', '正安县', '道真仡佬族苗族自治县'], zipBase: '563' }
        }
      },
      '甘肃省': {
        cities: {
          '兰州市': { districts: ['城关区', '七里河区', '西固区', '安宁区', '红古区', '永登县', '皋兰县', '榆中县'], zipBase: '730' },
          '天水市': { districts: ['秦州区', '麦积区', '清水县', '秦安县', '甘谷县', '武山县', '张家川回族自治县'], zipBase: '741' }
        }
      },
      '青海省': {
        cities: {
          '西宁市': { districts: ['城东区', '城中区', '城西区', '城北区', '湟中区', '大通回族土族自治县', '湟源县'], zipBase: '810' }
        }
      },
      '宁夏回族自治区': {
        cities: {
          '银川市': { districts: ['兴庆区', '西夏区', '金凤区', '永宁县', '贺兰县', '灵武市'], zipBase: '750' }
        }
      },
      '新疆维吾尔自治区': {
        cities: {
          '乌鲁木齐市': { districts: ['天山区', '沙依巴克区', '新市区', '水磨沟区', '头屯河区', '达坂城区', '米东区', '乌鲁木齐县'], zipBase: '830' }
        }
      },
      '西藏自治区': {
        cities: {
          '拉萨市': { districts: ['城关区', '堆龙德庆区', '达孜区', '林周县', '当雄县', '尼木县', '曲水县', '墨竹工卡县'], zipBase: '850' }
        }
      },
      '海南省': {
        cities: {
          '海口市': { districts: ['秀英区', '龙华区', '琼山区', '美兰区'], zipBase: '570' },
          '三亚市': { districts: ['海棠区', '吉阳区', '天涯区', '崖州区'], zipBase: '572' }
        }
      }
    };
  }


  /**
   * 常见街道名称
   */
  static getStreetNames() {
    return [
      '人民路', '解放路', '中山路', '建设路', '和平路', '文化路', '新华路', '胜利路',
      '长江路', '黄河路', '北京路', '上海路', '南京路', '广州路', '深圳路', '杭州路',
      '朝阳路', '光明路', '幸福路', '团结路', '友谊路', '民主路', '科技路', '创业路',
      '学府路', '大学路', '青年路', '工业路', '商业街', '步行街', '金融街', '高新路',
      '滨河路', '湖滨路', '海滨路', '山水路', '花园路', '公园路', '体育路', '文艺路',
      '东风路', '西湖路', '南湖路', '北湖路', '中央大道', '世纪大道', '迎宾大道', '环城路'
    ];
  }

  /**
   * 生成随机中国地址
   */
  static generateChinaAddress() {
    const provinceData = this.getChinaProvinceData();
    const streetNames = this.getStreetNames();
    
    // 随机选择省份
    const provinces = Object.keys(provinceData);
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    
    // 随机选择城市
    const cities = Object.keys(provinceData[province].cities);
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    // 随机选择区县
    const cityData = provinceData[province].cities[city];
    const district = cityData.districts[Math.floor(Math.random() * cityData.districts.length)];
    
    // 随机选择街道
    const street = streetNames[Math.floor(Math.random() * streetNames.length)];
    
    // 随机门牌号
    const streetNo = Math.floor(Math.random() * 500) + 1;
    const buildingNo = Math.floor(Math.random() * 30) + 1;
    const roomNo = Math.floor(Math.random() * 2500) + 101;
    
    // 生成邮编（基于城市的邮编前缀 + 随机后缀）
    const zipSuffix = String(Math.floor(Math.random() * 100)).padStart(3, '0');
    const zipCode = cityData.zipBase + zipSuffix;
    
    return {
      country: '中国',
      province: province,
      city: city,
      district: district,
      addressLine1: `${street}${streetNo}号`,
      addressLine2: `${buildingNo}栋${roomNo}室`,
      zipCode: zipCode
    };
  }


  /**
   * 香港地区数据
   */
  static getHongKongData() {
    return {
      regions: [
        { value: 'KOWLOON', label: '九龍 — Kowloon' },
        { value: 'HONG KONG', label: '香港島 — Hong Kong' },
        { value: 'NEW TERRITORIES', label: '新界 — New Territories' }
      ],
      kowloonDistricts: [
        'Mong Kok', 'Tsim Sha Tsui', 'Jordan', 'Yau Ma Tei', 'Sham Shui Po',
        'Kowloon City', 'Wong Tai Sin', 'Kwun Tong', 'Hung Hom', 'To Kwa Wan'
      ],
      hongKongDistricts: [
        'Central', 'Wan Chai', 'Causeway Bay', 'North Point', 'Quarry Bay',
        'Admiralty', 'Sheung Wan', 'Sai Ying Pun', 'Kennedy Town', 'Aberdeen'
      ],
      newTerritoriesDistricts: [
        'Sha Tin', 'Tsuen Wan', 'Tuen Mun', 'Yuen Long', 'Tai Po',
        'Fanling', 'Sheung Shui', 'Kwai Chung', 'Tsing Yi', 'Ma On Shan'
      ],
      streets: [
        'Nathan Road', 'Queens Road', 'Des Voeux Road', 'Hennessy Road',
        'Canton Road', 'Granville Road', 'Austin Road', 'Chatham Road',
        'Boundary Street', 'Prince Edward Road', 'Argyle Street', 'Waterloo Road'
      ]
    };
  }

  /**
   * 生成随机英文名（用于持卡人）
   */
  static generateEnglishName() {
    const firstNames = [
      'James', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas',
      'Mary', 'Jennifer', 'Linda', 'Patricia', 'Elizabeth', 'Susan', 'Jessica', 'Sarah',
      'Wei', 'Ming', 'Ling', 'Hui', 'Fang', 'Yan', 'Hong', 'Jing'
    ];
    const lastNames = [
      'Wong', 'Chan', 'Lee', 'Cheung', 'Lau', 'Ho', 'Ng', 'Tam',
      'Leung', 'Chow', 'Fung', 'Yip', 'Kwok', 'Tse', 'Mak', 'Hui'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  /**
   * 生成香港地址（适用于 Stripe 表单）
   */
  static generateHongKongAddress() {
    const hkData = this.getHongKongData();
    
    // 随机选择地区
    const regionIndex = Math.floor(Math.random() * hkData.regions.length);
    const region = hkData.regions[regionIndex];
    
    // 根据地区选择区域
    let districts;
    if (region.value === 'KOWLOON') {
      districts = hkData.kowloonDistricts;
    } else if (region.value === 'HONG KONG') {
      districts = hkData.hongKongDistricts;
    } else {
      districts = hkData.newTerritoriesDistricts;
    }
    
    const district = districts[Math.floor(Math.random() * districts.length)];
    const street = hkData.streets[Math.floor(Math.random() * hkData.streets.length)];
    const streetNo = Math.floor(Math.random() * 500) + 1;
    const floor = Math.floor(Math.random() * 30) + 1;
    const unit = String.fromCharCode(65 + Math.floor(Math.random() * 8)); // A-H
    
    return {
      country: 'HK',
      region: region.value,
      regionLabel: region.label,
      district: district,
      addressLine1: `${streetNo} ${street}`,
      addressLine2: `${floor}/F, Unit ${unit}`
    };
  }

  /**
   * 生成完整的卡信息（使用中国地址和中文名）
   */
  static generateFullCardInfo(bin) {
    const cardNumber = this.generateCardNumber(bin);
    const expiry = this.generateExpiry();
    const cvv = this.generateCVV();
    const name = this.generateChineseName();
    const address = this.generateChinaAddress();
    
    return {
      cardNumber,
      expMonth: expiry.month,
      expYear: expiry.year,
      cvv,
      name,
      address
    };
  }
}

module.exports = CardGenerator;
