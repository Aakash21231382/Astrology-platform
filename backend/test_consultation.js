const { getPool, executeProcedure } = require('./src/config/db');
const { generateAstrologyReply } = require('./src/services/aiChatService');

async function test() {
  const pool = await getPool();
  const req = pool.request();
  req.input("id", 9);
  const res = await req.query(`
    SELECT 
        c.*, 
        ep.userId AS expertUserId, 
        ep.displayName AS expertName, 
        ep.title AS expertTitle, 
        ep.bio, 
        w.balance AS customerWalletBalance, 
        uCust.fullName AS customerName, 
        uExp.avatarUrl AS expertAvatar 
    FROM dbo.Consultations c 
    JOIN dbo.ExpertProfiles ep ON ep.id = c.expertId 
    JOIN dbo.Wallets w ON w.userId = c.customerId 
    JOIN dbo.Users uCust ON uCust.id = c.customerId 
    JOIN dbo.Users uExp ON uExp.id = ep.userId 
    WHERE c.id = @id;
  `);
  const session = res.recordset[0];
  console.log("Session loaded:", session.expertName);

  const reply = await generateAstrologyReply({
    expertName: session.expertName,
    specialties: session.expertTitle,
    customerName: session.customerName,
    currentMessage: "my name is aakash and my birth 03/05/2007"
  });

  console.log("Generated AI Reply:", reply);

  const saveRes = await executeProcedure('dbo.sp_SaveChatMessage', {
    ConsultationId: 9,
    SenderId: session.expertUserId,
    SenderRole: 'EXPERT',
    MessageType: 'TEXT',
    Content: reply,
    FileUrl: null
  });

  console.log("Saved Message ID:", saveRes.recordset[0]);
}

test().then(() => process.exit(0)).catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});
