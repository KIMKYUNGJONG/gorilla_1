angular.module('gorilla.controllers', [])
.controller('AppCtrl', function($scope, $ionicConfig) {
  $scope.coreurl=coreurl;
  $scope.baseurl=baseurl;
  $scope.my_key=my_key;

  $scope.islogged = false;
  $scope.isguest = false;
  var user = JSON.parse(window.localStorage.getItem("login-profile"));

  if (user){
    $scope.islogged = true;
    if ((user).sns === "guest")
      $scope.isguest = true;
  }
  //alert("AppCtrl baseurl="+$scope.baseurl + " islogged=" +$scope.islogged +" isguest=" +$scope.isguest +" user->"+JSON.parse(user).sns);
})
.controller('WelcomeCtrl', function($scope, $state, $q, UserService, $ionicLoading) {
  // This is the success callback from the login method
  var fbLoginSuccess = function(response) {
    if (!response.authResponse){
      fbLoginError("Cannot find the authResponse");
      return;
    }

    var authResponse = response.authResponse;

    getFacebookProfileInfo(authResponse)
    .then(function(profileInfo) {
      // For the purpose of this example I will store user data on local storage
      UserService.setUser({
        authResponse: authResponse,
				userID: profileInfo.id,
				name: profileInfo.name,
				email: profileInfo.email,
        picture : "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
      });
      $ionicLoading.hide();
      //$state.go('app.home');
			$state.go('app.postJobMain');
    }, function(fail){
      // Fail get profile info
      console.log('profile info fail', fail);
    });
  };

  // This is the fail callback from the login method
  var fbLoginError = function(error){
    console.log('fbLoginError', error);
    $ionicLoading.hide();
  };

  // This method is to get the user profile info from the facebook api
  var getFacebookProfileInfo = function (authResponse) {
    var info = $q.defer();

    facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
      function (response) {
				console.log(response);
        info.resolve(response);
      },
      function (response) {
				console.log(response);
        info.reject(response);
      }
    );
    return info.promise;
  };

  //This method is executed when the user press the "Login with facebook" button
  $scope.facebookSignIn = function() {
    facebookConnectPlugin.getLoginStatus(function(success){
      if(success.status === 'connected'){
        // The user is logged in and has authenticated your app, and response.authResponse supplies
        // the user's ID, a valid access token, a signed request, and the time the access token
        // and signed request each expire
        console.log('getLoginStatus', success.status);

    		// Check if we have our user saved
    		var user = UserService.getUser('facebook');

    		if(!user.userID){
					getFacebookProfileInfo(success.authResponse)
					.then(function(profileInfo) {
						// For the purpose of this example I will store user data on local storage
						UserService.setUser({
							authResponse: success.authResponse,
							userID: profileInfo.id,
							name: profileInfo.name,
							email: profileInfo.email,
							picture : "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
						});

						//$state.go('app.home');
						$state.go('app.postJobMain');

					}, function(fail){
						// Fail get profile info
						console.log('profile info fail', fail);
					});
				}else{
					//$state.go('app.home');
					$state.go('app.postJobMain');

				}
      } else {
        // If (success.status === 'not_authorized') the user is logged in to Facebook,
				// but has not authenticated your app
        // Else the person is not logged into Facebook,
				// so we're not sure if they are logged into this app or not.

				console.log('getLoginStatus', success.status);

				$ionicLoading.show({
          template: 'Logging in...'
        });

				// Ask the permissions you need. You can learn more about
				// FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
        facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
      }
    });
  };
})
.controller('LoginCtrl', function($scope, $http, $state, $ionicModal, $timeout, $cordovaOauth, $ionicLoading, $ionicHistory) {
  $scope.coreurl=coreurl;
  $scope.baseurl=baseurl;
  $scope.my_key=my_key;
  //alert("LoginCtrl baseurl="+$scope.baseurl);

  $scope.islogged = false;
  $scope.isguest = false;

  $scope.sns = {};
  //if(!$scope.$$phase)
  if(!snsloginconnecting)
  {
    //$scope.$apply(function ()
    {
      //$scope.device = {};
      $scope.session ={};
      $scope.session.user_id = window.localStorage.getItem("session_id");
      /*$scope.device.uuid = window.localStorage.getItem("device.uuid");
      //$scope.device.serial = window.localStorage.getItem("device.serial");
      var platform = window.localStorage.getItem("device.platform");
      $scope.device.platformtype = '2001';
      if(platform === 'iOS'){
          $scope.device.platformtype = '2002';
      }
      $scope.device.osversion = window.localStorage.getItem("device.version");
      $scope.device.appversion = appversion;
      $scope.device.notification = 'Y';*/

      var user = JSON.parse(window.localStorage.getItem("login-profile"));

    	if (user){
        if(user.sns === 'guest'){
          $scope.islogged = true;
          $scope.isguest = true;
          $scope.me = user;
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go("app.postJobMain");
        }else{
          if(user.sns === 'facebook')
            $scope.sns.logintype = '1002';
          else if(user.sns === 'google')
            $scope.sns.logintype = '1003';
          $scope.sns.email = user.email;
          $scope.sns.name = user.name;
          $scope.sns.lastaccessed = 'now()';
          var url='/mobile/get_profile';
          $http({
              url: $scope.baseurl+url,
              method: "GET",
              params: {'my_key': $scope.my_key, 'sns':$scope.sns},
            }).then(function mySucces(response) {
                //alert("responded -->" +JSON.stringify(response.data));
                if(response.data.status==true){
                  user.name = response.data.name;
                  user.phone = response.data.phone;
                  user.picture = response.data.picture;
                  //response.data.picture = 'https://graph.facebook.com/'+result.data.id+'/picture?type=large';
                  window.localStorage.setItem("login-profile", JSON.stringify(user));
                  $scope.me = user;
                  alert('Welcome Back ' + $scope.me.name);
                  $scope.islogged = true;
                  /*if (user.sns === "guest")
                    $scope.isguest = true;
                  //$scope.me = user;*/
                  $ionicHistory.nextViewOptions({ disableBack: true });
                  $state.go("app.postJobMain");
                }
                /*{
                  $timeout(function() {
                    $ionicLoading.hide();
                  }, 1000);
                }*/
            });
        }
      }
  }
//);
}else{
  snsloginconnecting = false;
}

	$scope.goProfile = function() {
		$state.go("fbprofile");
	};
$scope.GPlogin = function(){
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).then(function(result) {
    // This gives you a Facebook Access Token. You can use it to access the Facebook API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    alert(token);
    alert(user);
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
};
	$scope.GPlogin1 = function(){
		$cordovaOauth.google(window.global.Google_OAUTH_ID, ["email profile"]).then(function(result) {
		    displayDataGP(result.access_token);
        $ionicHistory.nextViewOptions({ disableBack: true });
        $state.go("app.postJobMain");
		}, function(error) {
		    console.log("Error -> " + error);
		});
	};

	function displayDataGP(access_token){
	    $http.get("https://www.googleapis.com/oauth2/v2/userinfo", {params: {access_token: access_token}}).then(function(result) {
	        result.data.access_token = access_token;
          result.data.sns='google';
	       	window.localStorage.setItem("login-profile", JSON.stringify(result.data));
          $ionicHistory.nextViewOptions({ disableBack: true });
          $state.go("app.postJobMain");
	    }, function(error) {
	        alert("Error: " + error);
	    });
	}

  $scope.FBlogin = function(){
    var provider = new firebase.auth.FacebookAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function(result) {
      // This gives you a Facebook Access Token. You can use it to access the Facebook API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      alert(token);
      alert(user);
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      // ...
    });

    /*if(ionic.Platform.isWebView()){

      $cordovaFacebook.login(["public_profile", "email"]).then(function(success){

        console.log(success);

        ref.authWithOAuthToken("facebook", success.authResponse.accessToken, function(error, authData) {
          if (error) {
            console.log('Firebase login failed!', error);
          } else {
            console.log('Authenticated successfully with payload:', authData);
          }
        });

      }, function(error){
        console.log(error);
      });

    }
    else */{


    }

  };
	$scope.FBlogin1 = function(){
		$cordovaOauth.facebook(window.global.Facebook_APP_ID, ["email", "public_profile", "user_about_me"]).then(function(result) {
		    displayDataFB(result.access_token);

		}, function(error) {
		    console.log("Error -> " + error);
		});
	};
  $scope.Guestlogin = function(){
      window.localStorage.setItem("login-profile", JSON.stringify({'sns':'guest'}));
      $scope.sns.logintype = '1001';
      //$scope.sns.email = result.data.email;
      //$scope.sns.name = result.data.name;
      $scope.sns.lastaccessed = 'now()';
      $scope.islogged = true;
      $scope.isguest = true;

      registerDevice();
//      $ionicHistory.nextViewOptions({ disableBack: true });
//      $state.go("app.postJobMain");
  };

	function displayDataFB(access_token){
	    $http.get("https://graph.facebook.com/v2.6/me", {params: {access_token: access_token, fields: "cover,email,name,about,picture", format: "json" }}).then(function(result) {
	        result.data.access_token = access_token;
          result.data.sns='facebook';
	        result.data.picture = 'https://graph.facebook.com/'+result.data.id+'/picture?type=large';

        $scope.sns.logintype = '1002';
        $scope.sns.email = result.data.email;
        $scope.sns.name = result.data.name;
        $scope.sns.lastaccessed = 'now()';

        var url='/mobile/get_profile';
        $http({
            url: $scope.baseurl+url,
            method: "GET",
            params: {'my_key': $scope.my_key, 'sns':$scope.sns},
          }).then(function mySucces(response) {
              alert("responded -->" +JSON.stringify(response.data));
              if(response.data.status==true){
                response.data.access_token = access_token;
                response.data.sns='facebook';
                //response.data.picture = 'https://graph.facebook.com/'+result.data.id+'/picture?type=large';
                window.localStorage.setItem("login-profile", JSON.stringify(response.data));
                $scope.me = JSON.parse(response.data);
              }else{
                window.localStorage.setItem("login-profile", JSON.stringify(result.data));
                $scope.me = JSON.parse(result.data);
              }
              /*{
                $timeout(function() {
                  $ionicLoading.hide();
                }, 1000);
              }*/
          });

        registerDevice();
        $scope.islogged = true;

//        $ionicHistory.nextViewOptions({ disableBack: true });
//        $state.go("app.postJobMain");
				//alert("Success -> " + JSON.stringify(result.data));
	    }, function(error) {
	        alert("Error: " + error);
	    });
	}

  $scope.testDB = function(){
    //alert('my_key='+ $scope.my_key + ' device='+ $scope.device);
    /*$ionicLoading.show({
      template: '<img  src="img/loading.gif" />'
    });*/
      var url='/mobile/get_codes?groupid=0000';
      $http({
          url: $scope.baseurl+url,
          method: "GET",
          params: {'my_key': $scope.my_key},
        }).then(function mySucces(response) {

            alert("responded -->" +JSON.stringify(response.data));
            /*{
              $timeout(function() {
                $ionicLoading.hide();
              }, 1000);
            }*/
        });
  }
  function registerDevice(){
    /*$ionicLoading.show({
      template: '<img  src="img/loading.gif" />'
    });*/
    //$scope.session = {};
    $scope.device = {};
    $scope.device.uuid = window.localStorage.getItem("device.uuid");
    //$scope.device.serial = window.localStorage.getItem("device.serial");
    var platform = window.localStorage.getItem("device.platform");
    $scope.device.platformtype = '2001';
    if(platform === 'iOS'){
        $scope.device.platformtype = '2002';
    }
    $scope.device.osversion = window.localStorage.getItem("device.version");
    $scope.device.appversion = appversion;
    $scope.device.notification = 'Y';

      var url='/mobile/register_device';
      $http({
          url: $scope.baseurl+url,
          method: "GET",
          params: {'my_key': $scope.my_key, 'device': $scope.device, 'sns': $scope.sns},
        }).then(function mySucces(response) {
            //$scope.session.response = response.data;
            //alert("responded -->" +JSON.stringify(response.data));
            //alert("registering device= " + response.data.status + " user_id= " + response.data.user_id);
            if(response.data.status==true){
              $scope.session.user_id = response.data.user_id;
              window.localStorage.setItem("session_id", response.data.user_id);
              alert("$scope.session.user_id="+$scope.session.user_id);
              $ionicHistory.nextViewOptions({ disableBack: true });
              $state.go("app.postJobMain");
              //alert("$scope.session.user_id="+$scope.session.user_id);
            }
            /*if(response.data.status==true){
              $timeout(function() {
                $ionicLoading.hide();
              }, 1000);
            }else{
              $timeout(function() {
                $ionicLoading.hide();
              }, 1000);
            }*/
        });
  }

})
.controller('ResumeDataCtrl', function($scope, $http, $state, $cordovaDialogs, $ionicActionSheet) {
   $scope.shouldShowDelete = false;
   $scope.shouldShowReorder = false;
   $scope.listCanSwipe = true;

   function getcodefromfiletype(filetype){
     var cvfiletype = '3001';
     if(filetype == 'MS Word')
        cvfiletype = '3002';
     else if(filetype == 'PDF')
        cvfiletype = '3003';
     else if(filetype == 'Text')
         cvfiletype = '3004';
     return cvfiletype;
   }
   $scope.get_userCVList = function() {

        var url='/mobile/get_userCVList';
        $http({
            url: $scope.baseurl+url,
            method: "GET",
            params: {'my_key': $scope.my_key, 'user_id': $scope.session.user_id},
          }).then(function mySucces(response) {
              //$scope.session.response = response.data;
              //alert("responded -->" +JSON.stringify(response.data));
              //alert("registering device= " + response.data.status + " user_id= " + response.data.user_id);
              if(response.data.status==true){
                $scope.resumes = response.data.resumes;

                //$state.go($state.current, {}, {reload: true});
                //alert("$scope.session.user_id="+$scope.session.user_id);
              }
          });
       $scope.$broadcast('scroll.refreshComplete');
   }
     $scope.manageResume = function(){
       $scope.hideSheet = $ionicActionSheet.show({
           buttons: [
             { text: 'Take photo' },
             { text: 'PDF' },
             { text: 'Image' }
           ],
           titleText: 'Managing Resume by',
           cancelText: 'Cancel',
           buttonClicked: function(index) {
             $scope.hideSheet();

             if(index==0){
               var options = {
                 destinationType: Camera.DestinationType.DATA_URL,
                 sourceType: Camera.PictureSourceType.CAMERA,
                 //allowEdit: true,
                 encodingType: Camera.EncodingType.PNG,
                 targetWidth: 600,
                 targetHeight: 1000,
                 popoverOptions: CameraPopoverOptions,
                 saveToPhotoAlbum: false,
                 quality: 100,
               correctOrientation:true
             };
               $cordovaCamera.getPicture(options).then(function(imageData) {
                 $scope.file.resume="data:image/png;base64,"+imageData;
                 $scope.file.imgverified = true;
                 $state.go('app.manageImgResume');
             });

           }else if(index==1){

             $state.go('app.managePDFResume');

           }else {
             var options = {
               destinationType: Camera.DestinationType.DATA_URL,
               sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
               //allowEdit: true,
               targetWidth: 600,
               targetHeight: 1000,
               popoverOptions: CameraPopoverOptions,
               quality: 100,
             correctOrientation:true
           };

             $cordovaCamera.getPicture(options).then(function(imageData) {
               $scope.file.resume="data:image/png;base64,"+imageData;
               $scope.file.imgverified = true;
               $state.go('app.manageImgResume');
           });
           }
       }
       });
     };

     $scope.deleteResume = function(resume){
       $cordovaDialogs.confirm('Are you sure?', 'Confirm to Delete', ['Yes','No'])
     .then(function(buttonIndex) {
       if(buttonIndex==1){
         var url='/mobile/manage_usercv';
         var operation = 'delete';
         var data = {
             my_key: $scope.my_key,
             cvname: resume.filename,
             user_id: $scope.session.user_id,
             operation: operation,
             filetype: getcodefromfiletype(resume.filetype)
         };
         $http({
                method: 'POST',
                url: $scope.baseurl+url,
                data: data,
                dataType: 'json',
                headers:
                     {'Content-Type': 'application/x-www-form-urlencoded'}
         }).then(function mySucces(response) {
             //$scope.session.response = response.data;
             alert("responded -->" +JSON.stringify(response.data));
             //alert("registering device= " + response.data.status + " user_id= " + response.data.user_id);
             if(response.data.status==true){
               $scope.resumes = response.data.resumes;
               //$scope.file = {};
               //$state.go('app.managePDFResume', {}, {reload: true});
               $state.go($state.current, {}, {reload: true});
               //alert("$scope.session.user_id="+$scope.session.user_id);
             }else{
               alert("Error -->" +JSON.stringify(response.data.msg));
             }
           });
         }else
           return false;
         }, function(error) {
             alert("Error -> " + error);
         });
       }
       $scope.editResume = function(resume){
         $cordovaDialogs.prompt('Enter new name', 'Changing file name', ['OK','Cancel'], resume.filename)
       .then(function(result) {
         var input = result.input1;
         // no button = 0, 'OK' = 1, 'Cancel' = 2
         var btnIndex = result.buttonIndex;
         if(resume.filename == input || input.length ==0){
           alert('Error --> Not valid name');
           return;
         }
         if(btnIndex==1){
           var url='/mobile/manage_usercv';
           var operation = 'edit';
           var data = {
               my_key: $scope.my_key,
               cvname: resume.filename,
               newcvname: input,
               user_id: $scope.session.user_id,
               operation: operation,
               filetype: getcodefromfiletype(resume.filetype)
           };
           $http({
                  method: 'POST',
                  url: $scope.baseurl+url,
                  data: data,
                  dataType: 'json',
                  headers:
                     {'Content-Type': 'application/x-www-form-urlencoded'}
           }).then(function mySucces(response) {
               //$scope.session.response = response.data;
               alert("responded -->" +JSON.stringify(response.data));
               //alert("registering device= " + response.data.status + " user_id= " + response.data.user_id);
               if(response.data.status==true){
                 $scope.resumes = response.data.resumes;
                 //$scope.file = {};
                 //$state.go('app.managePDFResume', {}, {reload: true});
                 $state.go($state.current, {}, {reload: true});
                 //alert("$scope.session.user_id="+$scope.session.user_id);
               }else{
                 alert("Error -->" +JSON.stringify(response.data.msg));
               }
             });

           }else
             return false;
           }, function(error) {
               alert("Error -> " + error);
           });
         }
         $scope.openResume = function(resume){
             var url='/mobile/manage_usercv';
             var operation = 'open';
             var data = {
                 my_key: $scope.my_key,
                 cvname: resume.filename,
                 user_id: $scope.session.user_id,
                 operation: operation,
                 filetype: getcodefromfiletype(resume.filetype)
             };
             $http({
                    method: 'POST',
                    url: $scope.baseurl+url,
                    data: data,
                    dataType: 'json',
                    headers:
                       {'Content-Type': 'application/x-www-form-urlencoded'}
             }).then(function mySucces(response) {
                 //$scope.session.response = response.data;
                 alert("responded -->" +JSON.stringify(response.data));
                 //alert("registering device= " + response.data.status + " user_id= " + response.data.user_id);
                 if(response.data.status==true){
                   if(resume.filetype == 'PDF')
                   {
                       //console.log(fileLoadedEvent.target.result);
                       $scope.file.resume = response.data.resume.fileblob;
                       var myBaseString = response.data.resume.fileblob;
                       var block = myBaseString.split(";");
                       var dataType = block[0].split(":")[1];// In this case "application/pdf"
                       var realData = block[1].split(",")[1];// In this case "JVBERi0xLjcKCjE...."
                       var blob = new Blob([base64ToUint8Array(realData)], { type: dataType });
                       $scope.pdfUrl = URL.createObjectURL(blob);

                       $state.go($state.current, {}, {reload: true});
                       // Display the modal view
                       //vm.modal.show();
                   }else if(resume.filetype == 'Image'){
                     $scope.file.resume="data:image/png;base64,"+response.data.resume.fileblob;
                     $state.go('app.manageImgResume');
                   }

                   //$scope.file = {};
                   //$state.go('app.managePDFResume', {}, {reload: true});
                   //$state.go($state.current, {}, {reload: true});
                   //alert("$scope.session.user_id="+$scope.session.user_id);
                 }else{
                   alert("Error -->" +JSON.stringify(response.data.msg));
                 }
               });
           }
           $scope.get_userCVList();
   //$scope.resumes = [{filename:'TimHorton 20170101', filetype:'PDF'},{filename:'Zellers 20161101', filetype:'Image'},{filename:'CanadianTire 20150623', filetype:'Text'}];
})
.controller('PDFResumeCtrl', function($scope, $http, $state, $ionicHistory, $cordovaDialogs, $ionicActionSheet, $cordovaCamera, $cordovaFile, $ionicLoading, $ionicModal) {
  //var vm = this;
  //$scope.file ={};
  //setDefaultsForPdfViewer($scope);

  // Initialize the modal view.
  /*$ionicModal.fromTemplateUrl('pdf-viewer.html', {
      scope: $scope,
      animation: 'slide-in-up'
  }).then(function (modal) {
      vm.modal = modal;
  });*/

    $scope.$watch('files', function() {
      $scope.selectResume($scope.files);
    });
    /*function setDefaultsForPdfViewer($scope) {
        $scope.scroll = 0;
        $scope.loading = 'loading';

        $scope.onError = function (error) {
            console.error(error);
        };

        $scope.onLoad = function () {
            $scope.loading = '';
        };

        $scope.onProgress = function (progress) {
            console.log(progress);
        };
    }*/
    function base64ToUint8Array(base64) {
        var raw = atob(base64);
        var uint8Array = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) {
            uint8Array[i] = raw.charCodeAt(i);
        }
        return uint8Array;
    };
    $scope.selectResume = function(files){
      if (files && files.length) {
      //  alert(files[0].name);

        var fileToLoad = files[0];
        if(fileToLoad.type != 'application/pdf'){
          alert('Error --> File is not in pdf format!!');
          $scope.file.pdfverified = false;
          return;
        }
        $scope.file.pdfverified = true;
        $scope.file.name = files[0].name;
        var fileReader = new FileReader();
        fileReader.onload = function(fileLoadedEvent)
        {
            //console.log(fileLoadedEvent.target.result);
            $scope.file.resume = fileLoadedEvent.target.result;
            var myBaseString = fileLoadedEvent.target.result;
            var block = myBaseString.split(";");
            var dataType = block[0].split(":")[1];// In this case "application/pdf"
            var realData = block[1].split(",")[1];// In this case "JVBERi0xLjcKCjE...."
            var blob = new Blob([base64ToUint8Array(realData)], { type: dataType });
            $scope.pdfUrl = URL.createObjectURL(blob);

            $state.go($state.current, {}, {reload: true});
            // Display the modal view
            //vm.modal.show();
        };
        fileReader.readAsDataURL(fileToLoad);
      }
      };

        $scope.uploadResume = function(){
          $cordovaDialogs.prompt('Enter File name', 'Uploading Resume', ['OK','Cancel'], $scope.file.name)
        .then(function(result) {
          var input = result.input1;
          // no button = 0, 'OK' = 1, 'Cancel' = 2
          var btnIndex = result.buttonIndex;

          if(btnIndex==1){
            var url='/mobile/manage_usercv';
            var operation = 'insert';
            var filetype = '3003';
            var data = {
                my_key: $scope.my_key,
                cvname: input,
                cvblob: $scope.file.resume,
                user_id: $scope.session.user_id,
                operation: operation,
                filetype: filetype
            };
            $http({
                   method: 'POST',
                   url: $scope.baseurl+url,
                   data: data,
                   dataType: 'json',
                   headers:
                       {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function mySucces(response) {
                //$scope.session.response = response.data;
                alert("responded -->" +JSON.stringify(response.data));
                //alert("registering device= " + response.data.status + " user_id= " + response.data.user_id);
                if(response.data.status==true){
                  $scope.resumes = response.data.resumes;
                  $scope.file = {};
                  $scope.file.fileverified = false;
                  //$ionicHistory.goBack( );
                  $state.go('app.profile', {}, {reload: true});
                  //alert("$scope.session.user_id="+$scope.session.user_id);
                }else{
                  alert("Error -->" +JSON.stringify(response.data.msg));
                }
                /*if(response.data.status==true){
                  $timeout(function() {
                    $ionicLoading.hide();
                  }, 1000);
                }else{
                  $timeout(function() {
                    $ionicLoading.hide();
                  }, 1000);
                }*/
            });


          }else
            return false;
          }, function(error) {
              alert("Error -> " + error);
          });


          };


          // Clean up the modal view.
          /*$scope.$on('$destroy', function () {
              vm.modal.remove();
          });*/

          //return vm;
})
.controller('ImgResumeCtrl', function($scope, $http, $state, $ionicHistory, $cordovaDialogs, $ionicActionSheet, $cordovaCamera, $cordovaFile, $ionicLoading, $ionicModal) {

  $scope.uploadResume = function(){
    $cordovaDialogs.prompt('Enter File name', 'Uploading Resume', ['OK','Cancel'], $scope.file.name)
  .then(function(result) {
    var input = result.input1;
    // no button = 0, 'OK' = 1, 'Cancel' = 2
    var btnIndex = result.buttonIndex;

    if(btnIndex==1){
      var url='/mobile/manage_usercv';
      var operation = 'insert';
      var filetype = '3001';
      var data = {
          my_key: $scope.my_key,
          cvname: input,
          cvblob: $scope.file.resume,
          user_id: $scope.session.user_id,
          operation: operation,
          filetype: filetype
      };
      $http({
             method: 'POST',
             url: $scope.baseurl+url,
             data: data,
             dataType: 'json',
             headers:
                 {'Content-Type': 'application/x-www-form-urlencoded'}
      }).then(function mySucces(response) {
          //$scope.session.response = response.data;
          alert("responded -->" +JSON.stringify(response.data));
          //alert("registering device= " + response.data.status + " user_id= " + response.data.user_id);
          if(response.data.status==true){
            $scope.resumes = response.data.resumes;
            $scope.file = {};
            $scope.file.imgverified = false;
            //$ionicHistory.goBack();
            $state.go('app.profile', {}, {reload: true});
            //alert("$scope.session.user_id="+$scope.session.user_id);
          }else{
            alert("Error -->" +JSON.stringify(response.data.msg));
          }
          /*if(response.data.status==true){
            $timeout(function() {
              $ionicLoading.hide();
            }, 1000);
          }else{
            $timeout(function() {
              $ionicLoading.hide();
            }, 1000);
          }*/
      });


    }else
      return false;
    }, function(error) {
        alert("Error -> " + error);
    });


    };
/*
$scope.deleteResume = function(resume){
$cordovaDialogs.confirm('Are you sure?', 'Confirm to Delete', ['Yes','No'])
.then(function(buttonIndex) {
if(buttonIndex==1){
var url='/mobile/manage_usercv';
var operation = 'delete';
var filetype = '3001';
var data = {
  my_key: $scope.my_key,
  cvname: resume.filename,
  user_id: $scope.session.user_id,
  operation: operation,
  filetype: filetype
};
$http({
     method: 'POST',
     url: $scope.baseurl+url,
     data: data,
     dataType: 'json',
     headers:
          {'Content-Type': 'application/x-www-form-urlencoded'}
}).then(function mySucces(response) {
  //$scope.session.response = response.data;
  alert("responded -->" +JSON.stringify(response.data));
  //alert("registering device= " + response.data.status + " user_id= " + response.data.user_id);
  if(response.data.status==true){
    $scope.resumes = response.data.resumes;
    //$scope.file = {};
    //$state.go('app.manageImgResume', {}, {reload: true});
    $state.go($state.current, {}, {reload: true});
    //alert("$scope.session.user_id="+$scope.session.user_id);
  }else{
    alert("Error -->" +JSON.stringify(response.data.msg));
  }
});


}else
return false;
}, function(error) {
  alert("Error -> " + error);
});
}
$scope.editResume = function(resume){
$cordovaDialogs.prompt('Enter new name', 'Changing file name', ['OK','Cancel'], resume.filename)
.then(function(result) {
var input = result.input1;
// no button = 0, 'OK' = 1, 'Cancel' = 2
var btnIndex = result.buttonIndex;
if(resume.filename == input || input.length ==0){
alert('Error --> Not valid name');
return;
}
if(btnIndex==1){
var url='/mobile/manage_usercv';
var operation = 'edit';
var filetype = '3001';
var data = {
    my_key: $scope.my_key,
    cvname: resume.filename,
    newcvname: input,
    user_id: $scope.session.user_id,
    operation: operation,
    filetype: filetype
};
$http({
       method: 'POST',
       url: $scope.baseurl+url,
       data: data,
       dataType: 'json',
       headers:
          {'Content-Type': 'application/x-www-form-urlencoded'}
}).then(function mySucces(response) {
    //$scope.session.response = response.data;
    alert("responded -->" +JSON.stringify(response.data));
    //alert("registering device= " + response.data.status + " user_id= " + response.data.user_id);
    if(response.data.status==true){
      $scope.resumes = response.data.resumes;
      //$scope.file = {};
      //$state.go('app.manageImgResume', {}, {reload: true});
      $state.go($state.current, {}, {reload: true});
      //alert("$scope.session.user_id="+$scope.session.user_id);
    }else{
      alert("Error -->" +JSON.stringify(response.data.msg));
    }
  });


}else
  return false;
}, function(error) {
    alert("Error -> " + error);
});
}*/
})
.controller('UserProfileCtrl', function($scope, $http, $state, $ionicHistory, $cordovaDialogs, $ionicActionSheet, $cordovaCamera, $cordovaFile, $ionicLoading, $ionicModal) {
  //$scope.file = {};
  //$scope.session ={};


  $scope.openImagePicker = function(){
    	    $scope.hideSheet = $ionicActionSheet.show({
    	      	buttons: [
    	        	{ text: 'Take photo' },
    	        	{ text: 'Photo from library' }
    	      	],
    	      	titleText: 'Updating Avatar by',
    	      	cancelText: 'Cancel',
    	      	buttonClicked: function(index) {
    	        	$scope.hideSheet();

    		        if(index==0){
    			        var options = {
                    destinationType: Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    //allowEdit: true,
                    encodingType: Camera.EncodingType.PNG,
                    targetWidth: 150,
                    targetHeight: 150,
                    popoverOptions: CameraPopoverOptions,
                    saveToPhotoAlbum: false,
                    quality: 100,
              	  correctOrientation:true
    				    };

    			        $cordovaCamera.getPicture(options).then(function(imageData) {

    				        $scope.me.picture="data:image/png;base64,"+imageData;
                    $scope.session.newavatar = true;
    				    });

    			    }else{
                var options = {
                  destinationType: Camera.DestinationType.DATA_URL,
                  sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                  //allowEdit: true,
                  targetWidth: 150,
                  targetHeight: 150,
                  popoverOptions: CameraPopoverOptions,
                  quality: 100,
                correctOrientation:true
              };

                $cordovaCamera.getPicture(options).then(function(imageData) {

                  $scope.me.picture="data:image/png;base64,"+imageData;
                  $scope.session.newavatar = true;
              });
    		    	}
    			}
    	    });
  };

  $scope.updateProfile = function(param){
    var msg = 'Enter ' + param;
    var defaultinput = $scope.me.name;
    if (param === 'phone') {
      defaultinput =  $scope.me.phone;
    }else if (param === 'email') {
      defaultinput =  $scope.me.email;
    }
    $cordovaDialogs.prompt(msg, param, ['OK','Cancel'], defaultinput)
  .then(function(result) {
    var input = result.input1;
    // no button = 0, 'OK' = 1, 'Cancel' = 2
    var btnIndex = result.buttonIndex;

    if(btnIndex==1){
      if(param === 'name'){
        $scope.me.name = input;
      }else if (param === 'phone') {
        $scope.me.phone = input;
      }else if (param === 'email') {
        $scope.me.email = input;
      }
    }else
      return false;
    }, function(error) {
        alert("Error -> " + error);
    });
  };
  $scope.saveProfile = function () {
    $cordovaDialogs.confirm('Do you want to update your info?', 'Confirm to Update', ['Yes','No'])
        .then(function(buttonIndex) {
          // no button = 0, 'OK' = 1, 'Cancel' = 2
          if(buttonIndex==1){
            var url='/mobile/update_profile_post';
            var data = {
              my_key: $scope.my_key,
              user_id : $scope.session.user_id,
              name : $scope.me.name,
              email : $scope.me.email,
              phone : $scope.me.phone,
              picture : $scope.me.picture,
              newavatar : $scope.session.newavatar
            };
            $http({
                 method: 'POST',
                 url: $scope.baseurl+url,
                 data: data,
                 dataType: 'json',
                 headers:
                      {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function mySucces(response) {
              //$scope.session.response = response.data;
              alert("responded -->" +JSON.stringify(response.data));
              //alert("registering device= " + response.data.status + " user_id= " + response.data.user_id);
              if(response.data.status==true){
                var user = JSON.parse(window.localStorage.getItem("login-profile"));
                user.name = $scope.me.name;
                user.email = $scope.me.email;
                user.phone = $scope.me.phone;
                user.picture = $scope.me.picture;
                window.localStorage.setItem("login-profile", JSON.stringify(user));

                $ionicHistory.goBack();
              }else{
                alert("Error -->" +JSON.stringify(response.data.msg));
              }
            });
          }else
            return false;
          }, function(error) {
              alert("Error -> " + error);
          });
  };

	/*var user = window.localStorage.getItem("login-profile");
    if (user){
    	$scope.me = JSON.parse(user);
    }*/
    $scope.logout = function(){
    	$cordovaDialogs.confirm('Do you want to logout?', 'Confirm to Logout', ['Yes','No'])
          .then(function(buttonIndex) {
            // no button = 0, 'OK' = 1, 'Cancel' = 2
            if(buttonIndex==1){
            	window.localStorage.removeItem("login-profile");
              window.localStorage.removeItem("session_id");
              $ionicHistory.clearCache();
              $ionicHistory.nextViewOptions({ disableBack: true });
    					$location.path('/');
              //$state.go("login");
            }else
              return false;
						}, function(error) {
								alert("Error -> " + error);
						});
    };
})
.controller('MainCtrl', function($scope, $state) {
	$scope.jobApp = function() {
		$state.go('app.postJobMain');
	};

})
.controller('PostJobMainCtrl', function($scope, $ionicHistory) {
    //$ionicHistory.clearCache();
})
.controller('PostJobCtrl', function($scope) {
    $scope.backMainJob = function() {
		$state.go('app.postJobMain');
	};
})
.controller('PostJobStepOneCtrl', function($scope) {

})
.controller('PostJobStepTwoCtrl', function($scope) {

})
.controller('PostJobStepThreeCtrl', function($scope) {

})
.controller('PostJobStepForeCtrl', function($scope) {

})
.controller('PostJobStepFiveCtrl', function($scope) {

})
.controller('PostJobStepSixCtrl', function($scope) {

})
.controller('PostJobEmployCtrl', function($scope) {

})
.controller('PostJobSearchCtrl', function($scope, $ionicPopover, $location) {

//    var confirmPopup = $ionicPopup.confirm({
//         title: 'Improve location accuracy?',
//         template: 'This app wants to change \n your device setting'
//       });
//       confirmPopup.then(function(res) {
//         if(res) {
//           //$location.path('/app/myJobSearch');
//         } else {
//           //console.log('You are not sure');
//         }
//    });
   $scope.gotoBack = function() {
      $location.path('/app/postJobMain');
   };
   $scope.gotoFilter = function() {
      $location.path('/app/listViewFilter');
   };

   $scope.viewSelect = function($event) {
       $ionicPopover.fromTemplateUrl('views/app/listView.html', {
           scope: $scope
       }).then(function(popover) {
           $scope.popover = popover;
           $scope.popover.show($event);
       });
       $scope.closePopover = function() {
            $scope.popover.hide();
       };
       $scope.$on('$destroy', function() {
            $scope.popover.remove();//remember to remove this
       });
    };

   $scope.openPopover = function($event) {
       $ionicPopover.fromTemplateUrl('views/app/distance.html', {
           scope: $scope
       }).then(function(popover) {
           $scope.popover = popover;
           $scope.popover.show($event);
       });
       $scope.closePopover = function() {
            $scope.popover.hide();
       };
       $scope.$on('$destroy', function() {
            $scope.popover.remove();//remember to remove this
       });
    };
})
.controller('PostJobMapSearchCtrl', function($scope, $ionicPopover, $location) {

    $scope.gotoBack = function() {
        $location.path('/app/postJobMain');
    };

    $scope.gotoFilter = function() {
        $location.path('/app/mapViewFilter');
    };

    $scope.viewSelect = function($event) {
       $ionicPopover.fromTemplateUrl('views/app/mapView.html', {
           scope: $scope
       }).then(function(popover) {
           $scope.popover = popover;
           $scope.popover.show($event);
       });
       $scope.closePopover = function() {
            $scope.popover.hide();
       };
       $scope.$on('$destroy', function() {
            $scope.popover.remove();//remember to remove this
       });
    };
})
.controller('ListViewFilterCtrl', function($scope) {

})
.controller('MapViewFilterCtrl', function($scope) {

})
.controller('ApplicantCtrl', function($scope) {

})
.controller('RecentlyCtrl', function($scope, $ionicPopover) {

   $ionicPopover.fromTemplateUrl('views/app/distance.html', {
      scope: $scope
   }).then(function(popover) {
      $scope.popover = popover;
   });

   $scope.openPopover = function($event) {
      $scope.popover.show($event);
   };

   $scope.closePopover = function() {
      $scope.popover.hide();
   };

   //Cleanup the popover when we're done with it!
   $scope.$on('$destroy', function() {
      $scope.popover.remove();
   });

   // Execute action on hide popover
   $scope.$on('popover.hidden', function() {
      // Execute action
   });

   // Execute action on remove popover
   $scope.$on('popover.removed', function() {
      // Execute action
   });
})
.controller('ApplyCtrl', function($scope, $ionicPopover) {
   $ionicPopover.fromTemplateUrl('views/app/distance.html', {
      scope: $scope
   }).then(function(popover) {
      $scope.popover = popover;
   });

   $scope.openPopover = function($event) {
      $scope.popover.show($event);
   };

   $scope.closePopover = function() {
      $scope.popover.hide();
   };

   //Cleanup the popover when we're done with it!
   $scope.$on('$destroy', function() {
      $scope.popover.remove();
   });

   // Execute action on hide popover
   $scope.$on('popover.hidden', function() {
      // Execute action
   });

   // Execute action on remove popover
   $scope.$on('popover.removed', function() {
      // Execute action
   });
})
.controller('BookmarkCtrl', function($scope, $ionicPopover) {
    $ionicPopover.fromTemplateUrl('views/app/distance.html', {
      scope: $scope
   }).then(function(popover) {
      $scope.popover = popover;
   });

   $scope.openPopover = function($event) {
      $scope.popover.show($event);
   };

   $scope.closePopover = function() {
      $scope.popover.hide();
   };

   //Cleanup the popover when we're done with it!
   $scope.$on('$destroy', function() {
      $scope.popover.remove();
   });

   // Execute action on hide popover
   $scope.$on('popover.hidden', function() {
      // Execute action
   });

   // Execute action on remove popover
   $scope.$on('popover.removed', function() {
      // Execute action
   });
})
.controller('MatchedCtrl', function($scope, $ionicPopover) {
    $ionicPopover.fromTemplateUrl('views/app/distance.html', {
      scope: $scope
   }).then(function(popover) {
      $scope.popover = popover;
   });

   $scope.openPopover = function($event) {
      $scope.popover.show($event);
   };

   $scope.closePopover = function() {
      $scope.popover.hide();
   };

   //Cleanup the popover when we're done with it!
   $scope.$on('$destroy', function() {
      $scope.popover.remove();
   });

   // Execute action on hide popover
   $scope.$on('popover.hidden', function() {
      // Execute action
   });

   // Execute action on remove popover
   $scope.$on('popover.removed', function() {
      // Execute action
   });
})
.controller('MyJobSearchCtrl', function($scope) {

})
.controller('EmployInfoCtrl', function ($scope) {

})
.controller('LiveChatCtrl', function($scope, $timeout, $ionicScrollDelegate) {

    $scope.hideTime = true;

    var alternate,
        isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();

    $scope.sendMessage = function() {
        alternate = !alternate;

        var d = new Date();
        d = d.toLocaleTimeString().replace(/:\d+ /, ' ');

    $scope.messages.push({
      userId: alternate ? '12345' : '54321',
      text: $scope.data.message,
      time: d
    });

    delete $scope.data.message;
        $ionicScrollDelegate.scrollBottom(true);

    };


    $scope.inputUp = function() {
        if (isIOS) $scope.data.keyboardHeight = 216;
            $timeout(function() {
                $ionicScrollDelegate.scrollBottom(true);
        }, 300);
    };

    $scope.inputDown = function() {
        if (isIOS) $scope.data.keyboardHeight = 0;
        $ionicScrollDelegate.resize();
    };

    $scope.closeKeyboard = function() {
        // cordova.plugins.Keyboard.close();
    };


    $scope.data = {};
    $scope.myId = '12345';
    $scope.messages = [];

})
.controller('AppInterviewCtrl', function($scope) {

})
.controller('ArsInterviewCtrl', function($scope) {

})
.controller('PhoneInterviewCtrl', function($scope) {

})
.controller('PersonInterviewCtrl', function($scope) {

})
.controller('LivechatInterviewCtrl', function($scope) {

})
.controller('VideoInterviewCtrl', function($scope) {

})
.controller('PostingCtrl', function($scope) {

})
.controller('SideMenuCtrl', function($scope, $ionicSideMenuDelegate, $state, $cordovaDialogs) {
  alert('SideMenuCtrl');
  $scope.coreurl=coreurl;
  $scope.baseurl=baseurl;
  $scope.my_key=my_key;
  $scope.islogged = false;
  $scope.isguest = false;
  $scope.file ={};
  $scope.session ={};
  $scope.session.user_id = window.localStorage.getItem("session_id");
  var user = JSON.parse(window.localStorage.getItem("login-profile"));

  if (user){
    $scope.islogged = true;
    if ((user).sns === "guest")
      $scope.isguest = true;
    $scope.me = (user);
  }
  //alert("SideMenuCtrl baseurl="+$scope.baseurl + " islogged=" +$scope.islogged +" isguest=" +$scope.isguest +" user->"+JSON.parse(user).sns  );

    $scope.toggleGroup = function(group) {
        if ($scope.isGroupShown(group)) {
            $scope.shownGroup = null;
        } else {
            $scope.shownGroup = group;
        }
    };
    $scope.isGroupShown = function(group) {
        return $scope.shownGroup === group;
    };
    $scope.settingImg = function() {
        $state.go('app.setting');
        $ionicSideMenuDelegate.toggleLeft();
    };
    $scope.profileImg = function() {
        $state.go('app.profile');
        $ionicSideMenuDelegate.toggleLeft();
    };
    $scope.snsLog = function() {
        snsloginconnecting = true;
        $state.go('snslogin');
        $ionicSideMenuDelegate.toggleLeft();
    };
    $scope.logout = function(){
    	$cordovaDialogs.confirm('Do you want to logout?', 'Confirm to Logout', ['Yes','No'])
          .then(function(buttonIndex) {
            // no button = 0, 'OK' = 1, 'Cancel' = 2
            if(buttonIndex==1){
            	window.localStorage.removeItem("login-profile");
    					$state.go("login");
              $ionicSideMenuDelegate.toggleLeft();
            }else
              return false;
						}, function(error) {
								alert("Error -> " + error);
						});
    };
    $scope.gotoMessage = function() {
        $state.go('app.messageBox');
        $ionicSideMenuDelegate.toggleLeft();
    };
    $scope.gotoResume = function() {
        $state.go('app.manageResume');
        $ionicSideMenuDelegate.toggleLeft();
    };
    /*$scope.$on('$ionicView.beforeEnter', function () {
          // Code you want executed every time view is opened
          $scope.islogged = false;
          $scope.isguest = false;
          var user = window.localStorage.getItem("login-profile");

          if (user){
            $scope.islogged = true;
            if (JSON.parse(user).sns === "guest")
              $scope.isguest = true;
            $scope.me = JSON.parse(user);
          }
          alert('$ionicView.beforeEnter');
    });*/

})
.controller('SettingCtrl', function($scope) {

})
.controller('MessageBoxCtrl', function($scope) {

})

;
