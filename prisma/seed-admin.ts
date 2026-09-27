import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 관리자 대시보드 초기 데이터 시드 시작...\n');

  const isProd = process.env.NODE_ENV === 'production';

  // 1. 최고 관리자 계정 생성 (프로덕션에서는 시크릿 필수, 기본값 금지)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@biogram.co.kr';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME || '최관리';

  if (!adminPassword) {
    if (isProd) {
      throw new Error('SEED_ADMIN_PASSWORD must be set in production. Refusing to seed default credentials.');
    }
    console.warn('⚠️ SEED_ADMIN_PASSWORD 미설정 — 개발용 임시 비밀번호를 사용합니다. 프로덕션에서 절대 사용하지 마세요.');
  }
  const effectivePassword = adminPassword || 'Admin@1234-dev-only';

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const superadmin = await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(effectivePassword, 12),
        name: adminName,
        role: 'superadmin',
        isActive: true,
        // Seeded credentials must be rotated on first login
        mustChangePassword: true,
      },
    });
    console.log(`✅ 최고 관리자 생성: ${superadmin.email} (${superadmin.role})`);
  } else {
    console.log(`⏭️ 최고 관리자 이미 존재: ${adminEmail}`);
  }

  // 데모 계정들 (프로덕션에서는 생성하지 않음)
  if (isProd) {
    console.log('⏭️ 프로덕션: 데모 계정 생성 건너뜀');
  } else {
  const demoUsers = [
    { email: 'operator@biogram.co.kr', name: '이운영', role: 'admin' },
    { email: 'editor@biogram.co.kr', name: '박수정', role: 'editor' },
    { email: 'viewer@biogram.co.kr', name: '김조회', role: 'viewer' },
  ];

  for (const u of demoUsers) {
    const existing = await prisma.adminUser.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.adminUser.create({
        data: {
          email: u.email,
          passwordHash: await bcrypt.hash('Demo@1234', 12),
          name: u.name,
          role: u.role,
          isActive: true,
          mustChangePassword: true,
        },
      });
      console.log(`✅ 데모 계정 생성: ${u.email} (${u.role})`);
    }
  }
  } // end non-prod demo block

  // 2. 6가지 측정 항목 시드
  const measurements = [
    { key: 'height', name: '신장', description: '키를 측정합니다', icon: 'ruler', color: '#38BDF8', order: 1, estimatedTime: 1 },
    { key: 'stress', name: '스트레스', description: '스트레스 지수를 측정합니다', icon: 'brain', color: '#FB7185', order: 2, estimatedTime: 2 },
    { key: 'blood-pressure', name: '혈압', description: '혈압을 측정합니다', icon: 'heart-pulse', color: '#FBBF24', order: 3, estimatedTime: 2 },
    { key: 'grip-strength', name: '악력', description: '손아귀 힘을 측정합니다', icon: 'hand', color: '#A78BFA', order: 4, estimatedTime: 1 },
    { key: 'body-composition', name: '체성분', description: '체지방률과 근육량을 측정합니다', icon: 'scale', color: '#34D399', order: 5, estimatedTime: 2 },
    { key: 'skin', name: '피부', description: '피부 상태를 측정합니다', icon: 'scan-face', color: '#F472B6', order: 6, estimatedTime: 1 },
  ];

  for (const m of measurements) {
    const existing = await prisma.measurementItem.findUnique({ where: { key: m.key } });
    if (!existing) {
      await prisma.measurementItem.create({
        data: { ...m, isActive: true },
      });
      console.log(`✅ 측정 항목 생성: ${m.name}`);
    } else {
      console.log(`⏭️ 측정 항목 이미 존재: ${m.name}`);
    }
  }

  // 3. 장비 정보 시드
  const equipmentData: Record<string, Array<{
    name: string;
    description: string;
    preparationSteps: string[];
    precautions: { level: string; text: string }[];
    order: number;
  }>> = {
    'height': [{
      name: '초음파 신장계',
      description: '초음파 센서로 정확한 키를 측정합니다',
      preparationSteps: ['신장계 위에 올라서세요', '자세를 똑바로 하세요', '정면을 바라보세요', '측정 버튼을 누르세요'],
      precautions: [{ level: 'info', text: '신발을 벗고 측정하세요' }, { level: 'warning', text: '머리카락이 센서를 가리지 않게 하세요' }],
      order: 1,
    }],
    'stress': [{
      name: '스트레스 측정기',
      description: '심박수 변이도를 분석하여 스트레스 지수를 산출합니다',
      preparationSteps: ['손가락을 센서에 올려놓으세요', '편안하게 앉으세요', '1분간 가만히 계세요'],
      precautions: [{ level: 'warning', text: '측정 5분 전 커피나 담배를 피하지 마세요' }, { level: 'info', text: '측정 중 말하지 마세요' }],
      order: 1,
    }],
    'blood-pressure': [{
      name: '자동혈압계',
      description: '팔에 커프를 감아 자동으로 혈압을 측정합니다',
      preparationSteps: ['소매를 걷어 올립니다', '팔을 커프에 넣습니다', '심장 높이로 팔을 맞춥니다', '시작 버튼을 누릅니다'],
      precautions: [{ level: 'warning', text: '측정 전 5분간 안정을 취하세요' }, { level: 'info', text: '커프는 팔뚝 위에 감으세요' }, { level: 'info', text: '측정 중 움직이지 마세요' }],
      order: 1,
    }],
    'grip-strength': [{
      name: '디지털 악력계',
      description: '손아귀 힘을 정확하게 측정합니다',
      preparationSteps: ['악력계를 잡으세요', '최대 힘으로 꽉 쥐세요', '3초간 유지하세요', '천천히 놓으세요'],
      precautions: [{ level: 'info', text: '양손 각각 2회씩 측정합니다' }, { level: 'warning', text: '손이 아프면 즉시 중지하세요' }],
      order: 1,
    }],
    'body-composition': [{
      name: '체성분 분석기',
      description: '생체 전기 저항법으로 체지방, 근육량 등을 분석합니다',
      preparationSteps: ['맨발로 기기 위에 올라서세요', '발 패드에 발을 맞추세요', '손잡이를 잡으세요', '팔을 벌리세요'],
      precautions: [{ level: 'warning', text: '심박조율기 착용자는 측정 불가' }, { level: 'info', text: '금속 장신구를 제거하세요' }, { level: 'warning', text: '임산부는 측정하지 마세요' }],
      order: 1,
    }],
    'skin': [{
      name: '피부 분석기',
      description: '광학 센서로 피부 수분, 탄력, 색소를 분석합니다',
      preparationSteps: ['턱을 받침대에 올리세요', '이마를 패드에 대세요', '가만히 계세요'],
      precautions: [{ level: 'info', text: '측정 전 화장품을 닦아내세요' }, { level: 'info', text: '눈을 감으세요' }],
      order: 1,
    }],
  };

  for (const [key, items] of Object.entries(equipmentData)) {
    const measurement = await prisma.measurementItem.findUnique({ where: { key } });
    if (!measurement) continue;

    for (const eq of items) {
      const existing = await prisma.measurementEquipment.findFirst({
        where: { measurementId: measurement.id, name: eq.name },
      });
      if (!existing) {
        await prisma.measurementEquipment.create({
          data: {
            measurementId: measurement.id,
            name: eq.name,
            description: eq.description,
            preparationSteps: JSON.stringify(eq.preparationSteps),
            precautions: JSON.stringify(eq.precautions),
            order: eq.order,
          },
        });
        console.log(`✅ 장비 정보 생성: ${eq.name} (${key})`);
      }
    }
  }

  // 4. 13개 화면 콘텐츠 시드
  const screenContents = [
    { section: 'standby', title: '대기 화면', body: '키오스크 대기 상태입니다. 화면을 터치하면 교육이 시작됩니다.' },
    { section: 'main', title: '메인 메뉴', body: '배우고 싶은 교육 항목을 선택하세요.' },
    { section: 'equipment-intro', title: '장비 소개', body: 'Biogram MINI는 7가지 건강 지표를 측정하는 통합 헬스케어 장비입니다.', imageUrl: '/kiosk-images/equipment.png' },
    { section: 'location', title: '설치 위치 안내', body: '장비는 1층 로비 헬스케어 존에 설치되어 있습니다.', imageUrl: '/kiosk-images/location.png' },
    { section: 'app-install', title: '앱 설치 안내', body: '바이오그램 앱을 설치하면 측정 결과를 스마트폰에서 확인할 수 있습니다.' },
    { section: 'signup', title: '회원가입 안내', body: '앱 회원가입은 4단계로 진행됩니다.' },
    { section: 'vein-register', title: '지정맥 등록 안내', body: '지정맥(손등 정맥)을 등록하면 빠르게 로그인할 수 있습니다.' },
    { section: 'login', title: '로그인 안내', body: '지정맥 로그인과 QR코드 로그인 두 가지 방법이 있습니다.' },
    { section: 'non-member', title: '비회원 이용 안내', body: '회원가입 없이도 측정이 가능합니다. 단, 결과 저장이 제한됩니다.' },
    { section: 'measurement-mode', title: '측정 모드 안내', body: '전체 측정(6가지 항목)과 선택 측정이 가능합니다. 약 5~8분 소요됩니다.' },
    { section: 'measurement-equipment', title: '측정 장비 안내', body: '각 측정 항목별 장비 사용법과 주의사항을 확인하세요.' },
    { section: 'results', title: '결과 확인 안내', body: '측정 결과는 장비 화면, 앱, 문자 메시지로 확인할 수 있습니다.' },
    { section: 'completion', title: '교육 완료', body: '모든 교육을 완료하셨습니다. 실제 장비에서 측정을 시작하세요!' },
  ];

  for (const s of screenContents) {
    const existing = await prisma.kioskContent.findUnique({ where: { section: s.section } });
    if (!existing) {
      await prisma.kioskContent.create({
        data: {
          section: s.section,
          title: s.title,
          body: s.body,
          imageUrl: s.imageUrl || null,
        },
      });
      console.log(`✅ 화면 콘텐츠 생성: ${s.title}`);
    } else {
      console.log(`⏭️ 화면 콘텐츠 이미 존재: ${s.title}`);
    }
  }

  console.log('\n🎉 시드 완료!');
  console.log(`\n📋 관리자: ${adminEmail} (비밀번호는 환경변수 참조, 로그에 출력하지 않음)`);

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('시드 실패:', e);
  prisma.$disconnect();
  process.exit(1);
});
