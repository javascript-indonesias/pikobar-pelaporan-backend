const Check = require('../helpers/rolecheck');
const Filter = require('../helpers/casefilter');
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

module.exports = {
  sqlCondition, conditionAge, conditionGender
}