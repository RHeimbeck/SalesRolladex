(function(){

    var app = angular.module('myApp', []);

    //--------------------------------------------------------------------------
    app.controller('UserController', ['$http', function($http) {
        var self = this,
            userArr = [],
            userCount = 0,
            userIndex = {},
            logsArr = [],
            prom1, prom2,
            user, i;

        this.users = [];

        prom1 = $http.get('json/users.json');
        prom2 = $http.get('json/logs.json');

        prom1.success(function(userData){
            prom2.success( function(logData){
                userArr = userData;

                // Create a fast index as an object
                // that links the users id to the index where it is found in the userArr
                userCount = userArr.length;
                for(i = 0; i < userCount; i++){
                    user = userArr[i];
                    userIndex[ user.id ] = i;
                    user.intl = user.name[0];
                }

                logsArr = logData;
                processLogs();
                self.users = userArr;

                // Add the user data to the app object so the chart directive can access it.
                app.UserDataPassed = userArr;
            });
        });

        function processLogs () {
            var i, idx,
                records = {},
                rec,
                id,
                type,
                dateStr,
                user,
                logLength = logsArr.length;

            // Create Object of log records, indexed by user ID
            for(i = 0; i < logLength; i++){
                var log = logsArr[i];
                id = log.user_id;
                if(!id) continue;

                if(!records[id]){
                    records[id] = {impressions:0, conversions:0, revenue:0, convHits:{}};
                }
                type = log['type'];
                rec = records[id];
                if(type === 'impression'){
                    rec.impressions++;
                }
                else if(type === 'conversion'){
                    rec.conversions++;
                    rec.revenue += log['revenue'];

                    dateStr = log.time.split(' ')[0];
                    if(!rec.convHits[dateStr]){
                        rec.convHits[dateStr] = 1;
                    }
                    else {
                        rec.convHits[dateStr] += 1;
                    }
                }
            }

            // Read all the log records from the set object, and transfer
            // data over to userArr records.
            for( rec in records){
                // rec will be the user 'id'
                idx = userIndex[rec];
                user = userArr[idx];
                if(user){
                    var data = records[rec];
                    var hitsArr = [], hits;

                    for(hits in data.convHits){
                        hitsArr.push( data.convHits[hits] );
                    }

                    user.idx = idx;
                    user.impressions = data.impressions;
                    user.conversions = data.conversions;
                    user.totalRevenue = data.revenue;
                    user.convHits = hitsArr;
                }
            }
        }
    }]);

    //--------------------------------------------------------------------
    app.directive("drawChart", function() {
        var options = {
                animation          : false,
                bezierCurve        : false,
                pointDot           : false,
                scaleGridLineColor : 'rgba(0,0,0,0)',
                scaleLineColor     : 'rgba(0,0,0,0)',
                scaleShowGridLines : false,
                scaleShowLabels    : false
            },
            chartData = {
                labels : [],
                datasets : [{
                    data        : [],
                    fillColor   : 'rgba(0, 0, 0, 0)',
                    strokeColor : 'rgba(0, 0, 0, 1)'
                }]
            },
        // 50 blank labels.
            blankLabels = ['','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','',''];

        function addChart (scope, element, attributes){
            var ctx = element[0].getContext('2d'),
                idx = parseInt(attributes['drawChart']),
                hits = app.UserDataPassed[idx].convHits;

            chartData.labels = blankLabels.slice(0, hits.length);
            chartData.datasets[0].data = hits;
            new Chart(ctx).Line(chartData, options);
        }

        return {
            restrict: "A",
            template: "",
            link: addChart,
            scope: {}
        };
    });
})();




