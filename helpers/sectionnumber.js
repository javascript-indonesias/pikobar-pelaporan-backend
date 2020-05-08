const Check = require('../helpers/rolecheck');
const Filter = require('../helpers/casefilter');

const conditionConfirmResult = async (user, query) => {
  const search = Check.countByRole(user);
  const filter = await Filter.filterCase(user, query);
  const searching = Object.assign(search, filter);
  const queryConfirm = [
        {
            $match: {
                $and: [
                    searching,
                    {"delete_status": {"$ne": "deleted"}},
                    {"status": "POSITIF"}
                ]
            }
        },
        {
            $project: {
                createdAt: {$dateToString: { 
                    format: "%Y/%m/%d",
                    date: "$createdAt" 
                }},
                final_result: 1
            }
        },
        {
            $group: { 
                _id: {createdAt: "$createdAt"},
                positif : {$sum: 
                           { $cond: [ 
                             { $or : [ 
                                { $eq: ["$final_result", ""] },
                                { $eq: ["$final_result", 0] },
                                { $eq: ["$final_result", null] }
                            ] },1,0 ] }},
                sembuh : {$sum: {$cond: { if: { $eq: ["$final_result",'1'] }, then: 1, else: 0 }}},
                meninggal : {$sum: {$cond: { if: { $eq: ["$final_result",'2'] }, then: 1, else: 0 }}},
            }
        },
        {
            $sort: {
                "_id.createdAt": 1
            }
        },
        {
            $project: {
                _id: 0,
                positif: 1,
                sembuh: 1,
                meninggal: 1,
                total: {$sum: ["$positif","$sembuh", "$meninggal"]},
                date: "$_id.createdAt"
            }
        }
      ]

  return queryConfirm
}

const sqlCondition = async (user, query, status) => {
  const search = Check.countByRole(user);
  const filter = await Filter.filterCase(user, query);
  const searching = Object.assign(search, filter);
  const condition = [{
      $match: {
        $and: [ searching, 
                { "delete_status": { "$ne": "deleted" } },
                { "status": status }
              ]
        }
      },
    {
      $project: {
        createdAt: { $dateToString: { format: "%Y/%m/%d", date: "$createdAt" }
        },
        stage: 1
      }
    },
    {
      $group: {
        _id: { createdAt: "$createdAt" },
        proses: {
          $sum: { $cond: { if: { $eq: ["$stage", '0'] }, then: 1, else: 0 } }
        },
        selesai: {
          $sum: { $cond: { if: { $eq: ["$stage", '1'] }, then: 1, else: 0 }
          }
        },
        total: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.createdAt": 1 }
    },
    {
      $project: {
        _id: 0,
        date: "$_id.createdAt",
        proses: 1,
        selesai: 1,
        total: 1
      }
    }
  ]

  return condition
}

const conditionAge = async (user, query) => {
  const search = Check.countByRole(user);
  const filter = await Filter.filterCase(user, query);
  const searching = Object.assign(search, filter);
  const ageCondtion = [
    {$match: { 
      $and: [searching, {"delete_status": {"$ne": "deleted"}}, {"status":"POSITIF", 
      "final_result" : { "$in": [null,"",0] }}]
    }},
    {$bucket:
    {
      groupBy: "$age", 
      boundaries: [0,10,20,30,40,50,60,70,80,90,100], 
      default: "other", 
      output : {
        "total": {$sum: 1},
        "male" : {$sum : {$cond: { if: { $eq: [ "$gender", "L" ] }, then: 1, else: 0 }}},
        "female" : {$sum : {$cond: { if: { $eq: [ "$gender", "P" ] }, then: 1, else: 0 }}} }
      }
    }
  ];

  return ageCondtion
}

const conditionGender = async (user, query) => {
  const search = Check.countByRole(user);
  const filter = await Filter.filterCase(user, query);
  const searching = Object.assign(search, filter);
  const genderCondition = [
    { $match: { 
      $and: [ searching, {"delete_status": {"$ne": "deleted"}}, 
      {"status":"POSITIF", "final_result" : { "$in": [null,"",0] }}]
    }},
    { $group: { _id: "$gender", "total": { $sum: 1 }}}
  ];
  return genderCondition
}

const summaryAgregatePerDinkes = (user, query) => {


  let queryAgt = [
    {
        $match: {
            $and: [
                {"delete_status": {"$ne": "deleted"}}
            ]
        }
    },
    {
        $group: {
            _id: {kabkota: '$author_district_code'},
            odp_proses: {$sum: 
                        { $cond: [ 
                            { $and : [ 
                                { $eq: [ "$status", "ODP"] },
                                { $eq: [ "$stage","0"] }
                            ] },1,0 ] }},
            pdp_proses: {$sum: 
                        { $cond: [ 
                            { $and : [ 
                                { $eq: [ "$status", "PDP"] },
                                { $eq: [ "$stage","0"] }
                            ] },1,0 ] }},
            otg_proses: {$sum: 
                        { $cond: [ 
                            { $and : [ 
                                { $eq: [ "$status", "OTG"] },
                                { $eq: [ "$stage","0"] }
                            ] },1,0 ] }},
            positif_aktif: {$sum: 
                          { $cond: [ 
                             { $and : [ 
                                { $eq: [ "$status", "POSITIF"] },
                                {$or:[
                                        { $eq: ["$final_result",null]},
                                        { $eq: ["$final_result", ""] },
                                        { $eq: ["$final_result", 0]}
                                    ]}
                            ] },1,0 ] }},
            positif_sembuh: {$sum: 
                        { $cond: [ 
                            { $and : [ 
                                { $eq: [ "$status", "POSITIF"] },
                                { $eq: [ "$final_result","1"] }
                            ] },1,0 ] }},
            positif_meninggal: {$sum: 
                        { $cond: [ 
                            { $and : [ 
                                { $eq: [ "$status", "POSITIF"] },
                                { $eq: [ "$final_result","2"] }
                            ] },1,0 ] }},
        }
    },
    {
        $project: {
            _id: 0,
            kab_kota: {$toUpper: "$_id.kabkota"},
            odp_proses: 1,
            pdp_proses: 1,
            otg_proses: 1,
            positif_aktif: 1,
            positif_sembuh: 1,
            positif_meninggal: 1,
            total: {$sum: ["$odp_proses" , "$pdp_proses" , "$otg_proses" , "$positif_aktif" , "$positif_sembuh" , "$positif_meninggal"]}
        }
    },
    {
        $sort: {"kab_kota": -1}
    },
  ]


  return queryAgt
}

module.exports = {
  sqlCondition, 
  conditionAge, 
  conditionGender, 
  conditionConfirmResult,
  summaryAgregatePerDinkes
}