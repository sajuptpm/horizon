# vim: tabstop=4 shiftwidth=4 softtabstop=4
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

import django.shortcuts
import django.views.defaults
from horizon.test import helpers as test
import inspect
import sys


def dispatcher(request, test_name):
    classes = inspect.getmembers(sys.modules[__name__], inspect.isclass)
    if not test_name:
        return django.shortcuts.render(
            request,
            "horizon/jasmine/index.html",
            {'classes': (cls_name for cls_name, _ in classes)}
        )
    else:
        for cls_name, cls in classes:
            if cls_name == test_name:
                template = cls.template_name

                if not template:
                    template = "horizon/jasmine/jasmine.html"

                return django.shortcuts.render(
                    request,
                    template,
                    {'specs': cls.specs, 'sources': cls.sources})

    return django.views.defaults.page_not_found(request)


class ServicesTests(test.JasmineTests):
    sources = [
        'horizon/js/angular/horizon.conf.js',
        'horizon/js/angular/services/horizon.utils.js'
    ]
    specs = ['horizon/tests/jasmine/utilsSpec.js']
